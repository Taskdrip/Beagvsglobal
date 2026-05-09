import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Briefcase, MapPin, Clock, Users, Ship, FileText,
  Truck, Package, Globe, Phone, CheckCircle
} from "lucide-react";

const openings = [
  {
    title: "Customs Clearance Officer",
    location: "Apapa Port, Lagos",
    type: "Full-time",
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    description: "Process customs documentation, liaise with Nigeria Customs Service officers, and ensure timely clearance of import and export cargo at Apapa Port.",
    requirements: [
      "Minimum 2 years experience in customs clearance",
      "Sound knowledge of NCS tariff classification and HS codes",
      "Experience with eTrade and TradeModernisation platforms",
      "OND/HND/BSc in Accounting, Law, or related field",
      "Strong attention to detail and documentation accuracy",
    ],
  },
  {
    title: "Freight Operations Coordinator",
    location: "Tin-Can Island Port, Lagos",
    type: "Full-time",
    icon: <Anchor className="w-5 h-5 text-cyan-500" />,
    description: "Coordinate sea freight shipments, liaise with shipping lines, manage container tracking, and ensure smooth port-to-door delivery operations.",
    requirements: [
      "3+ years experience in freight forwarding or shipping",
      "Familiar with shipping line portals (Maersk, MSC, CMA CGM, etc.)",
      "Knowledge of INCOTERMS and sea freight documentation",
      "Excellent communication and problem-solving skills",
      "HND/BSc in Transport Management, Logistics, or related field",
    ],
  },
  {
    title: "Air Cargo Handler",
    location: "Nahco / Sahco Cargo Shed, Lagos",
    type: "Full-time",
    icon: <Package className="w-5 h-5 text-purple-500" />,
    description: "Handle air cargo processing at Nahco and Sahco terminals, including acceptance, documentation, tracking, and delivery coordination.",
    requirements: [
      "2+ years in air cargo handling or aviation logistics",
      "Familiarity with IATA cargo handling standards",
      "Experience with cargo management systems (CMS)",
      "Ability to work shifts including early mornings",
      "IATA or FIATA certification is an advantage",
    ],
  },
  {
    title: "Door-to-Door Delivery Coordinator",
    location: "Ikorodu, Lagos (Head Office)",
    type: "Full-time",
    icon: <Truck className="w-5 h-5 text-green-500" />,
    description: "Plan and execute last-mile delivery operations, coordinate with transporter partners, and ensure accurate, on-time delivery to clients.",
    requirements: [
      "Experience in last-mile logistics or delivery operations",
      "Excellent knowledge of Lagos road network",
      "Strong client communication and reporting skills",
      "Valid driver's licence (Class B) is an advantage",
      "OND or equivalent in a relevant field",
    ],
  },
  {
    title: "Business Development Executive",
    location: "Lagos / Benin City (Hybrid)",
    type: "Full-time",
    icon: <Globe className="w-5 h-5 text-orange-500" />,
    description: "Drive new business growth by acquiring importers, exporters, and manufacturers as clients for our freight forwarding and cargo consolidation services.",
    requirements: [
      "3+ years B2B sales experience (logistics/trade preferred)",
      "Strong network among importers, exporters, and manufacturers",
      "Excellent presentation and negotiation skills",
      "Self-motivated with proven ability to meet revenue targets",
      "HND/BSc in Business Administration, Marketing, or related field",
    ],
  },
  {
    title: "Port Harcourt Operations Officer",
    location: "Port Harcourt Port",
    type: "Full-time",
    icon: <Ship className="w-5 h-5 text-teal-500" />,
    description: "Manage Beagvs Marine Services' operations at Port Harcourt Port, handling customs clearance, cargo coordination, and client liaison in the Niger Delta region.",
    requirements: [
      "Based in or willing to relocate to Port Harcourt",
      "3+ years experience in freight forwarding or port operations",
      "Good knowledge of Port Harcourt port procedures",
      "Ability to manage independent operations with minimal supervision",
      "HND/BSc in Logistics, Business, or related field",
    ],
  },
];

function Anchor(props: any) {
  return <Ship {...props} />;
}

export default function Careers() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* Hero */}
      <section className="crypto-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Careers at Beagvs Marine Services</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join a growing team at the forefront of Nigerian freight forwarding and customs clearance. We're building the logistics infrastructure for Africa's next era of trade.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Why work with us */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-dark mb-8 text-center">Why Work With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <CheckCircle className="w-8 h-8 text-green-500" />, title: "Industry Experience", desc: "Work alongside professionals with 20+ years in Nigerian ports and international freight." },
              { icon: <Globe className="w-8 h-8 text-blue-500" />, title: "Tech-Forward Company", desc: "We combine traditional freight expertise with cryptocurrency and digital marketplace innovation." },
              { icon: <Users className="w-8 h-8 text-purple-500" />, title: "Growth Opportunities", desc: "As we expand across Nigerian ports and internationally, there are real advancement paths for talented team members." },
            ].map((item) => (
              <Card key={item.title} className="border border-slate-100 text-center">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <h3 className="font-bold text-slate-dark mb-2">{item.title}</h3>
                  <p className="text-slate-medium text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Current Openings */}
        <section>
          <h2 className="text-2xl font-bold text-slate-dark mb-8">Current Openings</h2>
          <div className="space-y-6">
            {openings.map((job) => (
              <Card key={job.title} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          {job.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-dark">{job.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-medium mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-medium mb-4 leading-relaxed">{job.description}</p>
                      <div>
                        <h4 className="font-semibold text-slate-dark mb-2 text-sm">Requirements:</h4>
                        <ul className="space-y-1">
                          {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-medium">
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link href="/contact">
                        <Button className="bg-crypto-blue hover:bg-crypto-teal text-white w-full lg:w-auto" data-testid={`button-apply-${job.title}`}>
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How to Apply */}
        <section className="mt-16">
          <Card className="crypto-gradient text-white">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">How to Apply</h2>
                  <p className="text-blue-100 mb-4">
                    Send your CV and a brief cover letter indicating the role you're applying for to our offices directly, or call us to express your interest.
                  </p>
                  <p className="text-blue-100 text-sm">
                    Candidates from Lagos, Edo State, and Rivers State are encouraged to apply. Female candidates are equally encouraged.
                  </p>
                </div>
                <div className="space-y-3">
                  <a href="tel:+2348037232210" className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-3 transition-colors">
                    <Phone className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Call / WhatsApp</div>
                      <div className="text-blue-100 text-sm">+234 803 723 2210</div>
                    </div>
                  </a>
                  <a href="tel:+2348155576539" className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-3 transition-colors">
                    <Phone className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">Call / WhatsApp</div>
                      <div className="text-blue-100 text-sm">+234 815 557 6539</div>
                    </div>
                  </a>
                  <Link href="/contact">
                    <Button className="w-full bg-white text-crypto-blue hover:bg-blue-50 font-semibold mt-2" data-testid="button-careers-contact">
                      Send Your CV via Message
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      <Footer />
    </div>
  );
}
