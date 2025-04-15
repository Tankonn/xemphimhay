// app/api/authenticate/login/route.js
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserService from '@/Services/userService';
import RoleService from '@/Services/roleService';
import config from '@/setting.json';

const jwtExpirySeconds = 300;

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    console.log(`${username} is trying to login ..`);

    const userService = new UserService();
    const users = await userService.getuserList();

    const foundUser = users.find(
      u => u.username === username && u.password === password
    );

    if (!foundUser) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    let roleName = null;
    if (foundUser.roleId) {
      const roleId = typeof foundUser.roleId === 'string'
        ? new ObjectId(foundUser.roleId)
        : foundUser.roleId;
      const roleService = new RoleService();
      const role = await roleService.getrole(roleId);

      if (role && role.name) {
        roleName = role.name;
      }
    }
    
    var claims = [];

    if (roleName === "Admin") {
      claims.push("film.view");
      claims.push("film.edit");
      claims.push("film.delete");
    } else if (roleName === "User") {
      claims.push("film.view");
    }
    
    const token = jwt.sign(
      {
        user: foundUser.username,
        roles: roleName,
        claims: claims,
        userId: foundUser._id,
      },
      config.jwt.secret,
      { expiresIn: jwtExpirySeconds }
    );

    return NextResponse.json({
      token,
      role: roleName,
      claims: claims,
      userId: foundUser._id,
      redirectUrl: roleName === "Admin" ? "/admin/film" : "/home"
    });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}