import React from 'react';
import Seo from '@/components/Seo';
import { motion, useReducedMotion } from 'framer-motion';
import { LifeBuoy, Shield, Megaphone, Mail, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

const CONTACTS = [
  {
    icon: LifeBuoy,
    title: 'General Support',
    description: 'Technical issues, account questions, or product help.',
    email: 'support@herazur.com',
    colorClass: 'text-blue-500',
    subject: 'Herazur Support Request',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Data requests, privacy questions, or security reports.',
    email: 'privacy@herazur.com',
    colorClass: 'text-green-500',
    subject: 'Herazur Privacy/Security Inquiry',
  },
  {
    icon: Megaphone,
    title: 'Advertising & Partnerships',
    description: 'Business inquiries, ad opportunities, partnerships.',
    email: 'advertise@herazur.com',
    colorClass: 'text-purple-500',
    subject: 'Herazur Advertising/Partnership Proposal',
  },
];

const mailtoHref = (email, subject) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}`;

const ContactCard = ({ icon: Icon, title, description, email, colorClass, subject, index }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: 'Copied', description: `${email} copied to clipboard.` });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      viewport={{ once: true }}
    >
      <Card className="h-full flex flex-col bg-card/70 backdrop-blur border-border/60">
        <CardHeader className="flex-row items-start gap-4">
          <div className={`p-3 bg-muted rounded-full ${colorClass}`} aria-hidden>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="mt-auto">
          <div className="flex gap-2">
            <Button asChild className="w-full">
              <a href={mailtoHref(email, subject)} aria-label={`Email ${title}`}>
                <Mail className="mr-2 h-4 w-4" />
                {email}
              </a>
            </Button>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={copy} aria-label={`Copy ${email}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy address</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Contact = () => {
  const reduce = useReducedMotion();

  const heroAnim = reduce
    ? {}
    : { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Herazur',
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@herazur.com' },
      { '@type': 'ContactPoint', contactType: 'privacy', email: 'privacy@herazur.com' },
      { '@type': 'ContactPoint', contactType: 'advertising', email: 'advertise@herazur.com' },
    ],
  };

  return (
    <>
      <Seo
        title="Contact Us"
        description="Reach the Herazur team for support, privacy/security, or advertising and partnerships."
        schema={jsonLd}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div {...heroAnim} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We’re here to help. Choose the right channel and we’ll get back to you shortly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {CONTACTS.map((opt, i) => (
            <ContactCard key={opt.title} {...opt} index={i} />
          ))}
        </div>

        <Separator className="my-10" />

        {/* Optional: Responsible disclosure / SLA note */}

      </div>
    </>
  );
};

export default Contact;
