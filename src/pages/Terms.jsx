import React from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="Read the Terms of Service for using Herazur. Understand your rights and responsibilities as a user of our platform."
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
                <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none space-y-6 text-foreground">
                <p>
                  Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Herazur website ("Service").
                </p>

                <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                <p>
                  By using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you do not have permission to access the Service.
                </p>

                <h2 className="text-2xl font-semibold">2. Accounts</h2>
                <p>
                  When you create an account with us, you guarantee that you are above the age of 13, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
                </p>
                <p>
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>

                <h2 className="2xl font-semibold">3. User Content</h2>
                <p>
                  Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
                </p>
                <p>
                  By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
                </p>

                <h2 className="text-2xl font-semibold">4. Prohibited Uses</h2>
                <p>
                  You may use the Service only for lawful purposes. You may not use the Service:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>In any way that violates any national or international law or regulation.</li>
                  <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                  <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                  <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                </ul>

                <h2 className="text-2xl font-semibold">5. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>

                <h2 className="text-2xl font-semibold">6. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at <a href="mailto:support@herazur.com" className="text-primary hover:underline">support@herazur.com</a>.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Terms;
