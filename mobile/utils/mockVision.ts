// Mock Google Vision API for MVP
// In production, this would make actual API calls to Google Vision API

const mockProducts = [
  'Milk 1L',
  'Bread Loaf',
  'Rice 5kg',
  'Banana 1kg',
  'Chicken Breast 1kg',
  'Eggs 12 units',
  'Tomato 1kg',
  'Onion 1kg',
  'Potato 1kg',
  'Olive Oil 500ml',
  'Sugar 1kg',
  'Salt 1kg',
  'Coffee 500g',
  'Tea Bags 100 units',
  'Pasta 500g',
  'Cheese 200g',
  'Yogurt 170g',
  'Butter 200g',
  'Apple 1kg',
  'Orange 1kg',
];

export const mockVisionAPI = async (imageUri: string): Promise<string[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return random suggestions from mock products
  const shuffled = [...mockProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4); // Return top 4 suggestions
};