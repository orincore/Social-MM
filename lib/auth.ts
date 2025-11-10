import type { NextAuthOptions, User } from 'next-auth';
import { getServerSession as getNextAuthServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient, Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';

// Extend the User type to include our custom fields
declare module 'next-auth' {
  interface User {
    plan?: string;
  }
}

interface Credentials {
  email: string;
  password: string;
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME || 'social_mm',
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error('No user found with this email');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          plan: user.plan || 'free',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        // Add custom fields to the session user object
        session.user = {
          ...session.user,
          id: token.id,
          plan: token.plan,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan || 'free';
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Re-export the getServerSession function with our authOptions
export const getServerAuthSession = () => getNextAuthServerSession(authOptions);
