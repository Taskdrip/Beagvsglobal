import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
  Ship,
  Package,
  Anchor,
  Truck
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
  heroSubtitle: "Have questions about cargo services, shipping rates, or customs clearance? Our team is ready to help with all your freight and logistics needs.",
  email: "info@beagvsglobal.com",
  phone1: "+234 803 723 2210",
  phone2: "+234 815 557 6539",
  phone3: "+234 802 752 9083",
  whatsapp: "+2348037232210",
  address1: "No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos",
  address2: "No 21, Nevis Street, off Mission Road, Benin City, Edo State",
  hours: "Monday – Friday: 8:00 AM – 6:00 PM | Saturday: 9:00 AM – 3:00 PM",
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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Ship className="w-8 h-8 text-crypto-blue" />
            <div className="text-left">
              <span className="text-xl font-bold text-slate-dark block leading-tight">Beagvs Marine Services Nig Ltd</span>
              <span className="text-sm text-slate-medium">Freight Forwarder & Customs Licensed Agent</span>
            </div>
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
                  <Button onClick={() => setIsSubmitted(false)} data-testid="button-send-another">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="form-contact">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" {...form.register("firstName")} placeholder="John" data-testid="input-first-name" />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" {...form.register("lastName")} placeholder="Doe" data-testid="input-last-name" />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...form.register("email")} placeholder="you@example.com" data-testid="input-email" />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" {...form.register("subject")} placeholder="e.g. Cargo consolidation enquiry" data-testid="input-subject" />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.subject.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" {...form.register("message")} rows={6} placeholder="Tell us about your shipment requirements..." data-testid="input-message" />
                    {form.formState.errors.message && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.message.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-crypto-blue hover:bg-crypto-teal font-semibold"
                    disabled={contactMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {contactMutation.isPending ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send Message</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Phone Numbers */}
            <Card className="shadow-lg border border-slate-100">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start space-x-4" data-testid="contact-phone-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-crypto-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Phone / WhatsApp</h4>
                    <div className="space-y-1 mt-1">
                      {c.phone1 && <a href={`tel:${c.phone1.replace(/\s/g, "")}`} className="block text-slate-medium hover:text-crypto-blue transition-colors">{c.phone1}</a>}
                      {c.phone2 && <a href={`tel:${c.phone2.replace(/\s/g, "")}`} className="block text-slate-medium hover:text-crypto-blue transition-colors">{c.phone2}</a>}
                      {c.phone3 && <a href={`tel:${c.phone3.replace(/\s/g, "")}`} className="block text-slate-medium hover:text-crypto-blue transition-colors">{c.phone3}</a>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="contact-head-office">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Head Office</h4>
                    <p className="text-slate-medium text-sm mt-1">{c.address1}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="contact-branch-office">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Branch Office</h4>
                    <p className="text-slate-medium text-sm mt-1">{c.address2}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-testid="contact-hours">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-dark">Business Hours</h4>
                    <p className="text-slate-medium text-sm">{c.hours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operations Base */}
            <Card className="shadow-lg border border-slate-100">
              <CardHeader>
                <CardTitle>Operations Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Nahco Cargo Shed",
                    "Sahco Cargo Shed",
                    "Tin-Can Island Port",
                    "Apapa Port",
                    "Port Harcourt Port",
                  ].map((base) => (
                    <div key={base} className="flex items-center gap-3 text-sm text-slate-medium">
                      <MapPin className="w-4 h-4 text-crypto-blue shrink-0" />
                      {base}
                    </div>
                  ))}
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
                  <h4 className="font-semibold text-slate-dark mb-2">What cargo do you handle?</h4>
                  <p className="text-sm text-slate-medium">We handle all types of cargo — general goods, perishables, electronics, vehicles, and bulk commodities — via air and sea.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">How does cargo consolidation work?</h4>
                  <p className="text-sm text-slate-medium">We group multiple smaller shipments into one container (LCL), significantly reducing your shipping cost while maintaining delivery timelines.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">Do you offer customs clearance?</h4>
                  <p className="text-sm text-slate-medium">Yes, we are a licensed customs agent. We handle all NCS documentation, duty assessments, and port clearance for imports and exports.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-dark mb-2">Can I pay with cryptocurrency?</h4>
                  <p className="text-sm text-slate-medium">Yes! We accept Pi Network, USDT (on multiple chains), and other cryptocurrencies through our secure escrow payment system.</p>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="crypto-gradient text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">Need a Shipping Quote?</h3>
                <p className="text-blue-100 mb-6">Tell us your cargo details and we'll provide a competitive rate within 24 hours.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full bg-white text-crypto-blue hover:bg-blue-50 font-semibold" data-testid="button-create-account-cta">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/marketplace" className="flex-1">
                    <Button variant="outline" className="w-full border-2 border-white text-white bg-white/10 hover:bg-white hover:text-crypto-blue font-semibold" data-testid="button-browse-marketplace-cta">
                      Browse Services
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
