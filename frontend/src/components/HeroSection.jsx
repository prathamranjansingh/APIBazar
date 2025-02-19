import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Apple, LaptopIcon as Linux, ComputerIcon as Windows } from "lucide-react";

export function HeroSection() {
return (
    <section className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative block lg:hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl -z-10" />
                <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20194211-CLO5IQcmjwxw9NEAehido8I5zC6hMw.png"
                    alt="API Platform Illustration"
                    width={600}
                    height={600}
                    className="relative rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 mx-auto"
                />
            </div>
            <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        AI is powered by APIs.
                        <br />
                        APIs are powered by
                        <br />
                        <span className="text-orange-500">Postman.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-[600px] leading-relaxed mx-auto lg:mx-0">
                        Postman is your single platform for collaborative API development. Join 35+ million devs building great
                        APIs together, across the entire API lifecycle.
                    </p>
                </div>
                <div className="">
                    <div className="flex flex-col justify-center max-w-sm mx-auto lg:mx-0">
                        <Button className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium px-8">
                            Sign Up for Free
                        </Button>
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl -z-10" />
                <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20194211-CLO5IQcmjwxw9NEAehido8I5zC6hMw.png"
                    alt="API Platform Illustration"
                    width={600}
                    height={600}
                    className="relative rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-300"
                />
            </div>
        </div>
    </section>
);
}
