// app/api/authenticate/register/route.js
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import UserService from '@/services/userService';
import RoleService from '@/services/roleService';

export async function POST(request) {
  try {
    const { username, password, email, phonenumber, roleId } = await request.json();

    const userService = new UserService();
    const existingUser = await userService.getuserList();
    const isUsernameTaken = existingUser.some(user => user.username === username);
    
    if (isUsernameTaken) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    const roleService = new RoleService();
    let assignedRoleId = roleId;
    
    if (!roleId) {
      const userRole = await roleService.getroleList();
      const userRoleObj = userRole.find(role => role.name === "User");
      if (userRoleObj) {
        assignedRoleId = userRoleObj._id;
      }
    }

    const role = await roleService.getrole(assignedRoleId);
    if (!role) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    const newUser = {
      username,
      email,
      password,
      roleId: new ObjectId(assignedRoleId),
      phonenumber,
      image: "abc.png",
    };
    
    const result = await userService.insertuser(newUser);

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

  } catch (err) {
    console.error("Error during registration:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}