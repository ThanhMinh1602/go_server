const axios = require('axios');
const logger = require('../services/logger');
const { ok, badRequest } = require('../utils/responseHelper');

// Cache để tránh gọi Geocoding API quá nhiều
const locationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 phút

// Rate limiting cho Nominatim API (1 request/giây - tăng lên 2 giây để an toàn hơn)
let lastApiCallTime = 0;
const MIN_API_INTERVAL = 2000; // 2 giây để tránh bị block

// Block tracking - nếu bị block, tạm dừng gọi API
let isBlocked = false;
let blockUntil = 0;
const BLOCK_DURATION = 60 * 60 * 1000; // 1 giờ nếu bị block

// Helper function để đảm bảo rate limit
// Returns true nếu có thể gọi API, false nếu đang bị block
const waitForRateLimit = async () => {
  const now = Date.now();
  
  // Reset block status nếu đã hết thời gian block
  if (isBlocked && now >= blockUntil) {
    isBlocked = false;
    logger.info('Nominatim API block period expired, resuming API calls');
  }
  
  // Kiểm tra xem có đang bị block không
  if (isBlocked && now < blockUntil) {
    const waitTime = blockUntil - now;
    logger.warn(`Nominatim API is blocked. Will retry after ${Math.ceil(waitTime / 1000)}s`);
    return false; // Đang bị block, không thể gọi API
  }
  
  const timeSinceLastCall = now - lastApiCallTime;
  
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    const waitTime = MIN_API_INTERVAL - timeSinceLastCall;
    logger.debug(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCallTime = Date.now();
  return true; // Có thể gọi API
};

// Helper function để tạo headers cho Nominatim API
const getNominatimHeaders = () => {
  return {
    'User-Agent': 'GoGoApp/1.0 (https://github.com/yourusername/gogo; contact@yourdomain.com)', // User-Agent với contact info
    'Accept-Language': 'vi,en', // Ưu tiên tiếng Việt
    'Referer': 'https://yourdomain.com', // Referer header
  };
};

/**
 * @desc    Get address from lat/lng (simple - chỉ trả về area/town name)
 * @route   GET /api/location/address
 * @access  Public
 */
exports.getAddress = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return badRequest(res, 'Latitude and longitude are required');
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return badRequest(res, 'Invalid latitude or longitude');
    }

    // Kiểm tra cache
    const cacheKey = `address_${latNum.toFixed(4)}_${lngNum.toFixed(4)}`;
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info(`Returning cached address for ${cacheKey}`);
      return ok(res, null, { address: cached.data });
    }

    // Gọi Geocoding API
    logger.debug('Calling Nominatim API', { lat: latNum, lng: lngNum });
    
    // Đảm bảo rate limit
    const canCallApi = await waitForRateLimit();
    if (!canCallApi) {
      // Đang bị block, trả về null
      return ok(res, null, { address: null });
    }
    
    let response;
    try {
      response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latNum,
            lon: lngNum,
            format: 'json',
            addressdetails: 1,
          },
          headers: getNominatimHeaders(),
          timeout: 10000, // 10 seconds timeout
        }
      );
    } catch (apiError) {
      // Xử lý lỗi 403 (bị block)
      if (apiError.response?.status === 403) {
        isBlocked = true;
        blockUntil = Date.now() + BLOCK_DURATION;
        logger.error('Nominatim API blocked (403). Will retry after 1 hour', {
          error: apiError.message,
          blockUntil: new Date(blockUntil).toISOString(),
        });
        return ok(res, null, { address: null });
      }
      
      logger.error('Nominatim API call failed', {
        error: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
      });
      // Trả về null nếu API call thất bại
      return ok(res, null, { address: null });
    }

    logger.debug('Nominatim API response', {
      status: response.status,
      hasData: !!response.data,
      hasAddress: !!response.data?.address,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;
      const address = data.address;

      logger.debug('Address data from Nominatim', { address });

      if (address) {
        // Lấy town/area name - thử nhiều field khác nhau
        const town =
          address.suburb ||
          address.village ||
          address.town ||
          address.municipality ||
          address.city_district ||
          address.neighbourhood ||
          address.quarter ||
          address.hamlet ||
          address.city ||
          address.county ||
          address.district;

        logger.debug('Extracted town', { town, addressKeys: Object.keys(address) });

        if (town) {
          // Loại bỏ các từ không cần thiết
          let cleanTown = town
            .replace(/Xã\s*/gi, '')
            .replace(/Commune\s*/gi, '')
            .replace(/Phường\s*/gi, '')
            .replace(/Huyện\s*/gi, '')
            .replace(/Tỉnh\s*/gi, '')
            .replace(/Thành phố\s*/gi, '')
            .trim();

          logger.info('Returning address', { cleanTown });

          // Lưu vào cache
          locationCache.set(cacheKey, {
            data: cleanTown,
            timestamp: Date.now(),
          });

          // Cleanup cache cũ (giữ tối đa 100 entries)
          if (locationCache.size > 100) {
            const firstKey = locationCache.keys().next().value;
            locationCache.delete(firstKey);
          }

          return ok(res, null, { address: cleanTown });
        } else {
          logger.warn('No town found in address', { address });
        }
      } else {
        logger.warn('No address in response', { data });
      }
    } else {
      logger.warn('Invalid response from Nominatim', {
        status: response?.status,
        hasData: !!response?.data,
      });
    }

    return ok(res, null, { address: null });
  } catch (error) {
    logger.error('Error getting address from Geocoding service', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get full address from lat/lng (bao gồm area và địa chỉ đầy đủ)
 * @route   GET /api/location/full-address
 * @access  Public
 */
exports.getFullAddress = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return badRequest(res, 'Latitude and longitude are required');
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return badRequest(res, 'Invalid latitude or longitude');
    }

    // Kiểm tra cache
    const cacheKey = `full_${latNum.toFixed(4)}_${lngNum.toFixed(4)}`;
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info(`Returning cached full address for ${cacheKey}`);
      return ok(res, null, cached.data);
    }

    // Gọi Geocoding API
    logger.debug('Calling Nominatim API for full address', { lat: latNum, lng: lngNum });
    
    // Đảm bảo rate limit
    const canCallApi = await waitForRateLimit();
    if (!canCallApi) {
      // Đang bị block, trả về empty
      return ok(res, null, {
        area: '',
        address: '',
        name: '',
      });
    }
    
    let response;
    try {
      response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latNum,
            lon: lngNum,
            format: 'json',
            addressdetails: 1,
            namedetails: 1,
          },
          headers: getNominatimHeaders(),
          timeout: 10000,
        }
      );
    } catch (apiError) {
      // Xử lý lỗi 403 (bị block)
      if (apiError.response?.status === 403) {
        isBlocked = true;
        blockUntil = Date.now() + BLOCK_DURATION;
        logger.error('Nominatim API blocked (403). Will retry after 1 hour', {
          error: apiError.message,
          blockUntil: new Date(blockUntil).toISOString(),
        });
        return ok(res, null, {
          area: '',
          address: '',
          name: '',
        });
      }
      
      logger.error('Nominatim API call failed for full address', {
        error: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
      });
      return ok(res, null, {
        area: '',
        address: '',
        name: '',
      });
    }

    logger.debug('Nominatim API response for full address', {
      status: response.status,
      hasData: !!response.data,
      hasAddress: !!response.data?.address,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;
      const address = data.address;
      const displayName = data.display_name;
      const name = data.name;

      logger.debug('Full address data from Nominatim', { address, displayName, name });

      if (address) {
        // Lấy area (Xã/Phường/Thị trấn) - thử nhiều field khác nhau
        let area =
          address.village ||
          address.suburb ||
          address.city_district ||
          address.city || // Thêm city field (thường có trong response của Việt Nam)
          address.town ||
          address.municipality ||
          address.neighbourhood ||
          address.quarter ||
          address.hamlet ||
          address.county ||
          address.district;

        // Format area với prefix phù hợp
        if (area) {
          const areaLower = area.toLowerCase();
          if (
            !areaLower.includes('xã') &&
            !areaLower.includes('phường') &&
            !areaLower.includes('thị trấn') &&
            !areaLower.includes('ward')
          ) {
            if (address.village) {
              area = `Xã ${area}`;
            } else if (address.suburb || address.city_district || address.city) {
              // city thường là Phường ở Việt Nam
              area = `Phường ${area}`;
            } else if (address.town) {
              area = `Thị trấn ${area}`;
            }
          } else {
            // Nếu area đã có prefix, giữ nguyên nhưng loại bỏ "Phường" nếu có trong city
            // Ví dụ: "Phường Ngũ Hành Sơn" -> giữ nguyên
            area = area.trim();
          }
        }

        // Xây dựng địa chỉ đầy đủ
        let fullAddress = '';
        if (displayName) {
          fullAddress = displayName;
        } else if (name) {
          fullAddress = name;
        } else {
          // Xây dựng từ các thành phần
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (area) parts.push(area);
          if (address.county) parts.push(address.county);
          else if (address.district) parts.push(address.district);
          if (address.state) parts.push(address.state);
          else if (address.region) parts.push(address.region);
          fullAddress = parts.join(', ');
        }

        // Lấy tên địa điểm (POI name)
        const placeName =
          name ||
          address.amenity ||
          address.shop ||
          address.restaurant ||
          address.cafe ||
          '';

        const result = {
          area: area || '',
          address: fullAddress || '',
          name: placeName,
        };

        // Lưu vào cache
        locationCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        // Cleanup cache cũ
        if (locationCache.size > 100) {
          const firstKey = locationCache.keys().next().value;
          locationCache.delete(firstKey);
        }

        return ok(res, null, result);
      }
    }

    return ok(res, null, {
      area: '',
      address: '',
      name: '',
    });
  } catch (error) {
    logger.error('Error getting full address from Geocoding service', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

