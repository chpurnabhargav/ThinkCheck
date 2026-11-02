import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/download.ico" />
        <meta name="description" content="ThinkCheck: AI-generated quizzes, written-answer grading, learning roadmaps and study notes." />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
