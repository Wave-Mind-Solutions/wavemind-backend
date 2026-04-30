const otplib = require("otplib");
const qrcode = require("qrcode");

const generateSecret = () => {
  return otplib.authenticator.generateSecret();
};

const generateQRCode = async (userEmail, secret) => {
  const otpauth = otplib.authenticator.keyuri(userEmail, "WaveMind Solutions", secret);
  return await qrcode.toDataURL(otpauth);
};

const verifyToken = (token, secret) => {
  return otplib.authenticator.check(token, secret);
};

module.exports = { generateSecret, generateQRCode, verifyToken };
