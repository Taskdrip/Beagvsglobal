import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Phone,
  Send,
  CheckCircle,
  Globe
} from "lucide-react";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const CONTACT_DEFAULTS = {
  heroTitle: "Get In Touch",
  heroSubtitle:
    "Have questions about our crypto marketplace? Need help with a transaction? We'd love to hear from you and help with any inquiries.",
  email: "support@beagvs.global",
  phone: "+1 (555) 123-4567",
  address: "Serving customers worldwide",
  hoursTitle: "Business Hours",
  hours: "Monday - Friday: 9:00 AM - 6:00 PM UTC\nSaturday: 10:00 AM - 4:00 PM UTC\nSunday: Closed",
  responseTime: "Typical response within 24 hours",
};

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: savedContent } = useQuery<any>({ queryKey: ["/api/page-content/contact"] });
  const c = { ...CONTACT_DEFAULTS, ...(savedContent || {}) };

  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="w-8 h-8 text-crypto-blue" />
            <span className="text-2xl font-bold text-slate-dark">Beagvs Global</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-dark mb-4" data-testid="text-contact-title">
            {c.heroTitle}
          </h1>
          <p className="text-xl text-slate-medium max-w-3xl mx-auto">
            {c.heroSubtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-lg border border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-crypto-blue" />
                <span>Send us a message</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8" data-testid="success-message">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-dark mb-2">Message Sent!</h3>
                  <p className="text-slate-medium mb-6">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="form-contact">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...form.register("firstName")}
                        placeholder="John"
                        data-testid="input-first-name"
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...form.register("lastName")}
                        placeholder="Doe"
                        data-testid="input-last-name"
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="john@example.com"
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="How can we help?"
                      data-testid="input-subject"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.subject.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...form.register("message")}
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      data-testid="input-message"
                    />
                    {form.formState.errors.message && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-crypto-blue hover:bg-crypto-teal font-semibold"
                    disabled={contactMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {contactMutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          
          {/* Contact Information & Support */}
          <div className="space-y-8">
            {/* Contact Info */}
            <Card className="shadow-lg border border-slate-100">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4" data-testid="contact-email">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-crypto-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Email</h4>
                    <p className="text-slate-medium">{c.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4" data-testid="contact-whatsapp">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Phone / WhatsApp</h4>
                    <a 
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      {c.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4" data-testid="contact-hours">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">{c.hoursTitle}</h4>
                    {c.hours.split("\n").map((line: string, i: number) => (
                      <p key={i} className="text-slate-medium">{line}</p>
                    ))}
                    {c.responseTime && <p className="text-xs text-slate-400 mt-1">{c.responseTime}</p>}
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="contact-location">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Global Presence</h4>
                    <p className="text-slate-medium">{c.address}</p>
                    <p className="text-slate-medium">Decentralized operations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="shadow-lg border border-slate-100">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">How does the escrow system work?</h4>
                  <p className="text-sm text-slate-medium">
                    Our escrow system holds your payment securely until the transaction is complete. 
                    Only when both parties confirm the terms are met is the payment released.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">What cryptocurrencies do you support?</h4>
                  <p className="text-sm text-slate-medium">
                    We support Pi and USDT across multiple networks including TRON, TON, BNB Chain, 
                    Solana, and Avalanche.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">How can I become a verified seller?</h4>
                  <p className="text-sm text-slate-medium">
                    Complete your profile, add verified wallet addresses, and start with smaller 
                    transactions to build your reputation on our platform.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">What are your platform fees?</h4>
                  <p className="text-sm text-slate-medium">
                    We charge a 10% platform fee on completed transactions, which covers escrow 
                    protection, platform maintenance, and customer support.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="crypto-gradient text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-blue-100 mb-6">
                  Join thousands of users trading real estate and shipping services with cryptocurrency protection.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/sign-up" className="flex-1">
                    <Button 
                      className="w-full bg-white text-crypto-blue hover:bg-blue-50 font-semibold"
                      data-testid="button-create-account-cta"
                    >
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/marketplace" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-crypto-blue font-semibold transition-all duration-300"
                      data-testid="button-browse-marketplace-cta"
                    >
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-dark mb-8 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border border-slate-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-crypto-blue" />
                </div>
                <h3 className="font-semibold text-slate-dark mb-2">Getting Started Guide</h3>
                <p className="text-sm text-slate-medium mb-4">
                  Learn how to use our platform effectively with our comprehensive guide.
                </p>
                <Button variant="outline" size="sm" data-testid="button-getting-started">
                  View Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border border-slate-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-dark mb-2">Community Forum</h3>
                <p className="text-sm text-slate-medium mb-4">
                  Connect with other users and get answers from the community.
                </p>
                <Button variant="outline" size="sm" data-testid="button-community-forum">
                  Join Forum
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border border-slate-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-dark mb-2">Emergency Support</h3>
                <p className="text-sm text-slate-medium mb-4">
                  Need immediate help with an urgent transaction issue?
                </p>
                <Button variant="outline" size="sm" data-testid="button-emergency-support">
                  Get Help Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
