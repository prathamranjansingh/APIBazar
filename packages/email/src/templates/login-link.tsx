const APIBAZAR_LOGO = "https://assets.dub.co/wordmark.png"; // replace with correct path if needed
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";

export function LoginLink({
  email = "user@example.com",
  url = "http://localhost:8888/api/auth/callback/email?token=xyz&email=user@example.com",
}: {
  email: string;
  url: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your ApiBazar login link</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-gray-200 px-10 py-8">
            <Section className="mt-6">
              <Img
                src={APIBAZAR_LOGO}
                alt="ApiBazar"
                height="40"
                className="mx-auto"
              />
            </Section>
            <Heading className="mt-8 text-xl font-semibold text-black">
              Your Login Link
            </Heading>
            <Text className="text-sm leading-6 text-gray-700">
              Hello,
              <br />
              Use the button below to log into your ApiBazar account.
            </Text>
            <Section className="my-6 text-center">
              <Link
                href={url}
                className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white no-underline"
              >
                Sign in to ApiBazar
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-gray-700">
              Or copy and paste this link into your browser:
            </Text>
            <Text className="break-words text-sm text-blue-600">
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default LoginLink;
