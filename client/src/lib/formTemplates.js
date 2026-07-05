function q(type, label, opts = {}) {
  return {
    type,
    label,
    description: opts.description ?? '',
    options: opts.options ?? [],
    required: opts.required ?? false,
  };
}

export const FORM_TEMPLATES = [
  {
    id: 'customer-feedback',
    name: 'Customer feedback',
    blurb: 'Rating, NPS, and an open-ended question.',
    title: 'Customer Feedback',
    description: 'Help us improve — this takes about a minute.',
    questions: [
      q('rating', 'How would you rate your overall experience?', { required: true }),
      q('scale', 'How likely are you to recommend us to a friend or colleague?', { required: true }),
      q('multiple_choice', 'How did you hear about us?', {
        options: ['Search engine', 'Social media', 'Friend or colleague', 'Advertisement', 'Other'],
      }),
      q('long_text', "What's one thing we could do better?"),
    ],
  },
  {
    id: 'event-rsvp',
    name: 'Event RSVP',
    blurb: 'Attendance, guest count, and dietary notes.',
    title: 'Event RSVP',
    description: 'Let us know if you can make it.',
    questions: [
      q('short_text', 'Full name', { required: true }),
      q('email', 'Email address', { required: true }),
      q('multiple_choice', 'Will you be attending?', {
        options: ["Yes, I'll be there", "No, I can't make it", 'Maybe'],
        required: true,
      }),
      q('number', 'How many guests will you bring?'),
      q('long_text', 'Any dietary restrictions or notes?'),
    ],
  },
  {
    id: 'contact-form',
    name: 'Contact form',
    blurb: 'Name, email, subject, and message.',
    title: 'Contact Us',
    description: "Send us a message and we'll get back to you.",
    questions: [
      q('short_text', 'Name', { required: true }),
      q('email', 'Email', { required: true }),
      q('short_text', 'Subject', { required: true }),
      q('long_text', 'Message', { required: true }),
    ],
  },
  {
    id: 'employee-pulse',
    name: 'Employee pulse check',
    blurb: 'A quick weekly team check-in.',
    title: 'Weekly Pulse Check',
    description: 'A quick, anonymous check-in — takes under a minute.',
    questions: [
      q('scale', 'How satisfied are you with your work this week?', { required: true }),
      q('rating', 'How manageable was your workload?', { required: true }),
      q('multiple_choice', 'Do you feel supported by your team?', {
        options: ['Yes', 'Somewhat', 'No'],
        required: true,
      }),
      q('long_text', "Anything you'd like to share with your manager?"),
    ],
  },
];
