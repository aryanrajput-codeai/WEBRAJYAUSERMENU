import dotenv from "dotenv";
dotenv.config();

// Set up import.meta env variables for the typescript loader
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
    }
  }
};

import { onboardRestaurantTransaction, OnboardingData } from "../webrajya-pos---super-admin/src/supabaseDb";

async function runOnboarding() {
  const onboardingData: OnboardingData = {
    name: "Test Restaurant",
    ownerName: "John Smith",
    email: "john@testrestaurant.com",
    phone: "9999999999",
    address: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    gstNumber: "27AAAAA0000A1Z5",
    logo: "",
    plan: "trial",
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    currency: "INR",
    timezone: "Asia/Kolkata",
    invoicePrefix: "TR",
    branchName: "Main Branch",
    ownerPassword: "password123"
  };

  console.log("Starting onboarding for Test Restaurant...");
  const result = await onboardRestaurantTransaction(onboardingData);
  if (result.success) {
    console.log("🎉 Onboarding Succeeded! Restaurant Created:", result.restaurant);
  } else {
    console.error("❌ Onboarding Failed:", result.error, "Step:", result.step);
  }
}

runOnboarding();
