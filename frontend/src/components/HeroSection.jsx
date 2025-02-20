import { Button } from "@/components/ui/button";
import HeaderImg from "D:/Projects/APIBazaar/frontend/src/assets/HeaderImg.png";

export function HeroSection() {
    return (
        <section className="container px-6 py-12 md:py-24 lg:py-22">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                
                {/* Image comes first on mobile */}
                <div className="order-first lg:order-none flex justify-center lg:justify-center">
                    <img
                        src={HeaderImg}
                        alt="API Platform Illustration"
                        width={600}
                        height={600}
                        className="w-full max-w-[450px] mx-auto"
                    />
                </div>

                {/* Content Section */}
                <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                            AI is powered by APIs.
                            <br />
                            APIs are powered by
                            <br />
                            <span className="text-orange-500">API Bazar.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-lg leading-relaxed mx-auto lg:mx-0">
                        API Bazar is your one-stop marketplace for discovering, testing, and monetizing APIs. Join thousands of developers and businesses simplifying API integration across the entire development lifecycle.
                        </p>
                    </div>
                    
                    {/* Button */}
                    <div className="flex justify-center lg:justify-start">
                        <Button className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium px-8">
                            Sign Up for Free
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
