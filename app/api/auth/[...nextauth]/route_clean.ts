import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

const handler = NextAuth({
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
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback triggered:', { user: user?.id, provider: account?.provider });
      
      if (account?.provider === 'google') {
        // Google OAuth - main authentication
        return true;
      }
      
      if (account?.provider === 'github') {
        // GitHub OAuth
        return true;
      }
      
      console.log('Provider not supported:', account?.provider);
      return false;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        await dbConnect();
        const dbUser = await User.findOne({ 
          email: session.user.email,
          // Only Google/GitHub users, not Facebook OAuth users
          email: { $not: { $regex: /@facebook\.local$/ } }
        });
        
        if (dbUser) {
          // Extend session with user data
          (session.user as any).id = dbUser._id.toString();
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      
      // Only handle Google/GitHub OAuth in NextAuth
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          await dbConnect();
          
          // Find or create user
          let dbUser = await User.findOne({ email: user?.email });
          if (!dbUser) {
            // Create user if doesn't exist
            dbUser = new User({
              email: user?.email,
              name: user?.name,
              image: user?.image,
              lastLoginAt: new Date()
            });
            await dbUser.save();
            console.log('Created new user for OAuth:', user?.email);
          } else {
            // Update last login
            dbUser.lastLoginAt = new Date();
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
});

export { handler as GET, handler as POST };
