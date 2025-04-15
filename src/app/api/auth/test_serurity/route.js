import { NextResponse } from 'next/server';

export async function GET(request) {
  // The userData is added by middleware
  const userData = request.userData;
  
  return NextResponse.json({ 
    status: true, 
    message: "login success",
    userData
  });
}