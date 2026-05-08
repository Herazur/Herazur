import React from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import {Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="Read the Privacy Policy for Herazur to understand how we collect, use, and protect your personal information."
      />

      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none space-y-6 text-foreground">
                <p>
                  Welcome to Herazur ("we," "us," or "our"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                </p>

                <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
                <p>
                  We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
                </p>
                <p>
                  The personal information that we collect may include the following:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Personal Identification Information:</strong> Name, username, email address.</li>
                  <li><strong>Profile Information:</strong> Bio, profile picture, banner image, social media links, skills/tags.</li>
                  <li><strong>Usage Data:</strong> We may automatically collect information about your device and your use of our site, such as your IP address, browser type, operating system, and pages you've visited.</li>
                </ul>

                <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
                <p>
                  We use the information we collect or receive:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To create and manage your account.</li>
                  <li>To display your profile to other users and the public.</li>
                  <li>To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
                  <li>To improve our website in order to better serve you.</li>
                  <li>To send periodic emails regarding your account or other products and services.</li>
                </ul>

                <h2 className="text-2xl font-semibold">3. Sharing Your Information</h2>
                <p>
                  We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                </p>

                <h2 className="text-2xl font-semibold">4. Data Security</h2>
                <p>
                  We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
                </p>

                <h2 className="text-2xl font-semibold">5. Your Privacy Rights</h2>
                <p>
                  You may at any time review or change the information in your account or terminate your account by logging into your account settings and updating your account.
                </p>

                <h2 className="text-2xl font-semibold">6. Contact Us</h2>
                <p>
                  If you have questions or comments about this policy, you may email us at privacy@herazur.com.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
