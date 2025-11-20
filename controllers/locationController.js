const axios = require('axios');
const logger = require('../services/logger');
const { ok, badRequest } = require('../utils/responseHelper');

// Cache để tránh gọi Nominatim API quá nhiều
const locationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 phút

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

    // Gọi Nominatim API
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: {
          lat: latNum,
          lon: lngNum,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'GoApp/1.0', // Nominatim yêu cầu User-Agent
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    if (response.status === 200 && response.data) {
      const data = response.data;
      const address = data.address;

      if (address) {
        // Lấy town/area name
        const town =
          address.suburb ||
          address.village ||
          address.town ||
          address.municipality ||
          address.city_district;

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
        }
      }
    }

    return ok(res, null, { address: null });
  } catch (error) {
    logger.error('Error getting address from Nominatim', {
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

    // Gọi Nominatim API
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: {
          lat: latNum,
          lon: lngNum,
          format: 'json',
          addressdetails: 1,
          namedetails: 1,
        },
        headers: {
          'User-Agent': 'GoApp/1.0',
        },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data) {
      const data = response.data;
      const address = data.address;
      const displayName = data.display_name;
      const name = data.name;

      if (address) {
        // Lấy area (Xã/Phường/Thị trấn)
        let area =
          address.village ||
          address.suburb ||
          address.city_district ||
          address.town ||
          address.municipality ||
          address.neighbourhood;

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
            } else if (address.suburb || address.city_district) {
              area = `Phường ${area}`;
            } else if (address.town) {
              area = `Thị trấn ${area}`;
            }
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
    logger.error('Error getting full address from Nominatim', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

