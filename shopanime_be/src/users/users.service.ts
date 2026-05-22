import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { hashPassword } from '../auth/password.js';

function nullableString(value: unknown) {
  if (value === null || value === undefined) {return null;}
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalString(value: unknown) {
  if (value === undefined) {return undefined;}
  return nullableString(value);
}

function userStatus(value: unknown) {
  const status = nullableString(value)?.toUpperCase() || 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE', 'LOCKED'].includes(status)) {
    throw new BadRequestException('Invalid user status');
  }
  return status;
}

function userRole(value: unknown) {
  const role = nullableString(value)?.toUpperCase() || 'CUSTOMER';
  if (!['ADMIN', 'CUSTOMER'].includes(role)) {
    throw new BadRequestException('Invalid user role');
  }
  return role;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  getAllUsers() {
    return this.db.query('SELECT id, username, email, full_name, avatar_url, phone, status, role, created_at FROM users');
  }

  async createUser(body: any) {
    const username = nullableString(body.username);
    const email = nullableString(body.email)?.toLowerCase();
    if (!username || !email) {
      throw new BadRequestException('Username and email are required');
    }
    const password = body.password || 'password123';
    const result = await this.db.execute(
      `
        INSERT INTO users (username, email, password_hash, full_name, phone, avatar_url, status, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        username,
        email,
        await hashPassword(password),
        nullableString(body.full_name) || username,
        nullableString(body.phone),
        nullableString(body.avatar_url),
        userStatus(body.status),
        userRole(body.role),
      ],
    );
    return result.insertId;
  }

  async getUser(id: string) {
    const user = await this.db.one('SELECT id, username, email, full_name, avatar_url, phone, status, role, created_at FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, body: any) {
    const fullName = optionalString(body.full_name);
    const phone = optionalString(body.phone);
    const avatarUrl = optionalString(body.avatar_url);
    const status = body.status === undefined ? undefined : userStatus(body.status);
    const role = body.role === undefined ? undefined : userRole(body.role);
    const result = await this.db.execute(
      `
        UPDATE users
        SET full_name = COALESCE(?, full_name),
            phone = COALESCE(?, phone),
            avatar_url = COALESCE(?, avatar_url),
            status = COALESCE(?, status),
            role = COALESCE(?, role)
        WHERE id = ?
      `,
      [fullName ?? null, phone ?? null, avatarUrl ?? null, status ?? null, role ?? null, id],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(id: string) {
    const result = await this.db.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('User not found');
    }
  }

  getAddresses(id: string) {
    return this.db.query('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [id]);
  }

  async createAddress(id: string, body: any) {
    if (body.is_default) {
      await this.db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [id]);
    }

    const result = await this.db.execute(
      `
        INSERT INTO user_addresses (
          user_id, receiver_name, receiver_phone, address_line, ward, district,
          city, country, postal_code, address_type, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        nullableString(body.receiver_name),
        nullableString(body.receiver_phone),
        nullableString(body.address_line),
        nullableString(body.ward),
        nullableString(body.district),
        nullableString(body.city),
        nullableString(body.country) || 'Vietnam',
        nullableString(body.postal_code),
        nullableString(body.address_type) || 'HOME',
        body.is_default ? 1 : 0,
      ],
    );

    return result.insertId;
  }

  async updateAddress(userId: string, addressId: string, body: any) {
    if (body.is_default) {
      await this.db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const result = await this.db.execute(
      `
        UPDATE user_addresses
        SET receiver_name = COALESCE(?, receiver_name),
            receiver_phone = COALESCE(?, receiver_phone),
            address_line = COALESCE(?, address_line),
            ward = COALESCE(?, ward),
            district = COALESCE(?, district),
            city = COALESCE(?, city),
            country = COALESCE(?, country),
            postal_code = COALESCE(?, postal_code),
            address_type = COALESCE(?, address_type),
            is_default = COALESCE(?, is_default)
        WHERE id = ? AND user_id = ?
      `,
      [
        optionalString(body.receiver_name) ?? null,
        optionalString(body.receiver_phone) ?? null,
        optionalString(body.address_line) ?? null,
        optionalString(body.ward) ?? null,
        optionalString(body.district) ?? null,
        optionalString(body.city) ?? null,
        optionalString(body.country) ?? null,
        optionalString(body.postal_code) ?? null,
        optionalString(body.address_type) ?? null,
        body.is_default === undefined ? null : body.is_default ? 1 : 0,
        addressId,
        userId,
      ],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Address not found');
    }
  }

  async deleteAddress(userId: string, addressId: string) {
    const result = await this.db.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (result.affectedRows === 0) {
      throw new NotFoundException('Address not found');
    }
  }
}
