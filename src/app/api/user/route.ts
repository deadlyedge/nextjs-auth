import { NextResponse } from "next/server"
import * as argon2 from "argon2"
import { z } from "zod"

import db from "@/lib/db"

// define a schema for input validation
const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must have than 8 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, username, password } = userSchema.parse(body)

    // check if email already exists
    const existingUserByEmail = await db.user.findFirst({
      where: {
        email,
      },
    })
    if (existingUserByEmail) {
      return NextResponse.json(
        { user: null, message: "Email already exists" },
        { status: 409 }
      )
    }
    // check if username already exists
    const existingUserByUsername = await db.user.findFirst({
      where: {
        username,
      },
    })
    if (existingUserByUsername) {
      return NextResponse.json(
        { user: null, message: "Username already exists" },
        { status: 409 }
      )
    }

    // hash the password by argon2
    const hashedPassword = await argon2.hash(password)
    const newUser = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    })
    const { password: newUserPassword, ...rest } = newUser

    return NextResponse.json(
      {
        user: rest,
        massage: "User created successful.",
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        massage: "Something wrong.",
      },
      { status: 500 }
    )
  }
}
