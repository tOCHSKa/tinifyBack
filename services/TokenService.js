// 📦 services/TokenService.js
const { signToken } = require('../utils/jwt');

class TokenService {
  static generateCookie(res, payload) {
    const token = signToken(payload);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 3600000, // 1h
    });

    return token;
  }

  static clearCookie(res) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
  }
}

module.exports = TokenService;
