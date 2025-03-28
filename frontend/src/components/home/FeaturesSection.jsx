import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

export function FeaturesSection() {
  return (
    <section className="container px-8 md:px-28 py-12 md:py-24 lg:py-22 overflow-hidden">
      <motion.div
        className="space-y-4 text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bricolage font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          Move fast to that{" "}
          <span className="text-green-500 font-bricolage inline-block transform hover:scale-105 transition-transform"> 200 OK</span>
        </h2>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
          Transform API development from an individual to a team sport. Get to that first API call faster, improve
          developer onboarding, and increase API discoverability.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20194334-Ulq2N5mHXkAAsqdZNi3iGPiEYE7Zz1.png"
            alt="API Testing Interface"
            width={800}
            height={600}
            className="w-full hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 font-bricolage rounded-lg text-lg font-semibold">
              Discover and Explore a Vast Library of APIs
              </AccordionTrigger>
              <AccordionContent className="px-4 text-left text-muted-foreground">
              Find high-quality APIs across multiple industries, from finance to machine learning. Easily search, filter, and integrate the right API for your needs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-none">
              <AccordionTrigger className="hover:no-underline font-bricolage hover:bg-muted px-4 rounded-lg text-lg font-semibold">
              Test, Debug, and Optimize APIs with Ease
              </AccordionTrigger>
              <AccordionContent className="px-4 text-left text-muted-foreground">
              Execute API requests in real-time, analyze responses, and debug issues instantly. Our built-in testing tools help you streamline development and ensure API reliability.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-none">
              <AccordionTrigger className="hover:no-underline hover:bg-muted font-bricolage px-4 rounded-lg text-lg font-semibold">
              Monetize Your APIs and Reach a Global Audience
              </AccordionTrigger>
              <AccordionContent className="px-4 text-left text-muted-foreground">
              List your APIs on API Bazar and generate revenue effortlessly. With built-in analytics and payment integrations, you can track usage, manage subscriptions, and maximize earnings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-none">
              <AccordionTrigger className="hover:no-underline font-bricolage hover:bg-muted px-4 rounded-lg text-lg font-semibold">
              Collaborate, Build, and Deploy Faster
              </AccordionTrigger>
              <AccordionContent className="px-4 text-left text-muted-foreground">
              Work with your team in a shared API workspace, improving efficiency and reducing development time. Leverage automation tools to accelerate API lifecycle management.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
      
      
    </section>
  );
}
