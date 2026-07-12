class UserResponseDto {
    constructor({ id, email, username, role, firstName, lastName, address, phoneNumber }) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
        this.address = address;
        this.phoneNumber = phoneNumber;
    }

    static fromUser(user) {
        return new UserResponseDto({
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            phoneNumber: user.phoneNumber
        });
    }
}

module.exports = UserResponseDto;