// noinspection TypeScriptCheckImport,TypeScriptValidateTypes

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

export default NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    events: {
        createUser: async ({user}) => {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                apiVersion: process.env.STRIPE_API_VERSION
            });
            // let us create a stripe customer
            if(user.name && user.email) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name,
                });
                // also update our prisma user with the stripecustomerid
                await prisma.user.update({
                    where: {id: user.id},
                    data: {stripeCustomerId: customer.id}
                })
            }
        }
    }
});