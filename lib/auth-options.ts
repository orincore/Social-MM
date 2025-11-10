import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback triggered:', { user: user?.id, provider: account?.provider });
      if (!account?.provider) return false;
      return ['google', 'github'].includes(account.provider);
    },
    async session({ session }) {
      if (session.user?.email) {
        await dbConnect();
        const dbUser = await User.findOne({
          $and: [
            { email: session.user.email },
            { email: { $not: /@facebook\.local$/ } }
          ]
        });

        if (dbUser) {
          (session.user as any).id = dbUser._id.toString();
          if (dbUser.image) {
            session.user.image = dbUser.image;
          }
          if (dbUser.name) {
            session.user.name = dbUser.name;
          }
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          await dbConnect();

          let dbUser = await User.findOne({ email: user?.email });
          if (!dbUser) {
            dbUser = new User({
              email: user?.email,
              name: user?.name,
              image: user?.image,
              lastLoginAt: new Date()
            });
            await dbUser.save();
            console.log('Created new user for OAuth:', user?.email);
          } else {
            dbUser.lastLoginAt = new Date();
            if (user?.name && user.name !== dbUser.name) {
              dbUser.name = user.name;
            }
            if (user?.image && user.image !== dbUser.image) {
              dbUser.image = user.image;
            }
            await dbUser.save();
            console.log('Updated user login for OAuth:', dbUser.email);
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
      }

      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};
