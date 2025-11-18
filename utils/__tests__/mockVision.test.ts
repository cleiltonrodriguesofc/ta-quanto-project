import { mockVisionAPI } from '../mockVision';

describe('Mock Vision API', () => {
  it('should return array of product suggestions', async () => {
    const result = await mockVisionAPI('mock-image-uri');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
    expect(result.every(item => typeof item === 'string')).toBe(true);
  });

  it('should return different suggestions on multiple calls', async () => {
    const result1 = await mockVisionAPI('mock-image-uri-1');
    const result2 = await mockVisionAPI('mock-image-uri-2');

    // Due to randomization, results should likely be different
    expect(result1).not.toEqual(result2);
  });

  it('should simulate API delay', async () => {
    const startTime = Date.now();
    await mockVisionAPI('mock-image-uri');
    const endTime = Date.now();

    // Should take at least 1500ms due to setTimeout
    expect(endTime - startTime).toBeGreaterThanOrEqual(1400); // Allow some margin
  });

  it('should return valid product names', async () => {
    const result = await mockVisionAPI('mock-image-uri');

    // Check that all returned items are valid product names
    const validProducts = [
      'Milk 1L', 'Bread Loaf', 'Rice 5kg', 'Banana 1kg', 'Chicken Breast 1kg',
      'Eggs 12 units', 'Tomato 1kg', 'Onion 1kg', 'Potato 1kg', 'Olive Oil 500ml',
      'Sugar 1kg', 'Salt 1kg', 'Coffee 500g', 'Tea Bags 100 units', 'Pasta 500g',
      'Cheese 200g', 'Yogurt 170g', 'Butter 200g', 'Apple 1kg', 'Orange 1kg'
    ];

    result.forEach(product => {
      expect(validProducts).toContain(product);
    });
  });
});