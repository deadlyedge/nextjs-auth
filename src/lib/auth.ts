import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"

import { verify } from "argon2"

import db from "@/lib/db"

export const authOptions = {
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    // }),
    CredentialsProvider({
      name: "凭据登录",
      credentials: {
        email: { label: "用户名", type: "text", placeholder: "xdream" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const existingUser = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })
        if (!existingUser) return null

        console.log("user found")

        const passwordMatch = await verify(
          existingUser.password,
          credentials.password
        )
        if (!passwordMatch) return null

        console.log("password match")
        return {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username,
        }
      },
    }),
  ],
} satisfies NextAuthOptions
