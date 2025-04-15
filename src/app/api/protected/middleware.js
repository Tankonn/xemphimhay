import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import config from '/setting.json';

export function middleware(request) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add user data to request
    request.userData = decoded;
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }
}

// Configure which paths require authentication
export const middlewareconfig = {
  matcher: ['/api/secure/:path*', '/api/authenticate/test-security'],
};