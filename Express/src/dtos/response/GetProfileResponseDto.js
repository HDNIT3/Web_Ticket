class GetProfileResponseDto {
  constructor(success, message, data) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
  static ok(data) {
    return new GetProfileResponseDto(true, 'Lấy thông tin thành công!', data);
  }
  static fail(message) {
    return new GetProfileResponseDto(false, message, null);
  }
}
module.exports = GetProfileResponseDto;