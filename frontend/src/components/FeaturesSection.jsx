import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

export function FeaturesSection() {
  return (
    <section className="container px-4 md:px-6 py-12 md:py-24 lg:py-32 overflow-hidden">
      <motion.div
        className="space-y-4 text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          Move fast to that{" "}
          <span className="text-green-500 inline-block transform hover:scale-105 transition-transform">200 OK</span>
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
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-lg text-lg font-semibold">
                Execute, test, and interact with APIs in seconds
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                Get started quickly with our intuitive interface for testing and debugging APIs. Send requests, examine
                responses, and collaborate with your team in real-time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-none">
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-lg text-lg font-semibold">
                Reduce duplication of work for your teams
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                Share collections, environments, and test suites across your organization. Maintain a single source of
                truth for your API development workflow.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-none">
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-lg text-lg font-semibold">
                Faster time to first API call
              </AccordionTrigger>
              <AccordionContent className="px-4 text-muted-foreground">
                Start making API calls immediately with our user-friendly interface. No complex setup required - just
                enter your endpoint and start exploring.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
