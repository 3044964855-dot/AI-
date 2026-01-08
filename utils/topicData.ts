export const IELTS_TOPICS = [
  "Art & Creativity",
  "Shoes & Fashion",
  "Growing Plants",
  "Working with Elders",
  "Doing Things Well",
  "School Rules",
  "Public Places",
  "Carrying Things",
  "Going Out",
  "Borrowing & Lending",
  "Museums & History",
  "Advertisements",
  "Crowded Places",
  "Chatting with Friends",
  "Taking a Break",
  "Sharing with Others",
  "Friends & Relationships",
  "A Family Business",
  "An Important Friend",
  "A Creative Person",
  "A Successful Athlete",
  "A Place with Trees",
  "Recent Travel",
  "Using Foreign Language",
  "Social Media Stories",
  "Breaking Things",
  "Power Outage Stories",
  "Public Speaking",
  "Waiting for Something",
  "Making Decisions"
];

export const getRandomTopics = (count: number = 5): string[] => {
  const shuffled = [...IELTS_TOPICS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};