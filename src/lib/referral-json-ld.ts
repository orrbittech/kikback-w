export function createReferralJsonLd(siteUrl: string, appName: string) {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does the referral program work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sign in to get your unique referral code. Send it to friends. When they sign up and complete a purchase using your code, you earn reward points on their qualifying order.',
        },
      },
      {
        '@type': 'Question',
        name: 'When are my points issued?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Points appear as pending after a referred purchase. Issuance is finalized after review on your program’s cadence.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I refer myself?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Self-referrals are blocked to keep the program fair for everyone.',
        },
      },
    ],
  };

  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to refer and earn',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Get your code',
        text: 'Create an account and open your referral dashboard to copy your unique referral code.',
      },
      {
        '@type': 'HowToStep',
        name: 'Share',
        text: 'Send your code via text, email, or social — they enter it at checkout.',
      },
      {
        '@type': 'HowToStep',
        name: 'They shop',
        text: 'Your friend signs up with your code and gets a discount on their first purchase.',
      },
      {
        '@type': 'HowToStep',
        name: 'You earn',
        text: 'When their purchase completes, your points show as pending until they are issued.',
      },
    ],
  };

  const org = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: siteUrl,
    potentialAction: {
      '@type': 'ReadAction',
      target: siteUrl,
    },
  };

  return [faq, howTo, org];
}
