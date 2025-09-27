import { GoogleGenerativeAI } from '@google/generative-ai';

// Your Gemini API key
const GEMINI_API_KEY = 'AIzaSyDJfR2HD8mEgsYwudaSevI43tpCY6tZ_0w';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Content categories for better AI generation
export const CONTENT_CATEGORIES = [
  'Business & Marketing',
  'Technology & Innovation',
  'Health & Wellness',
  'Lifestyle & Travel',
  'Food & Cooking',
  'Education & Learning',
  'Entertainment & Fun',
  'Sports & Fitness',
  'Fashion & Beauty',
  'General'
];

// Enhanced Text Generation using Gemini
export async function generatePostContent(prompt: string, category?: string): Promise<string> {
  const maxRetries = 5;
  const baseDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!prompt.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const enhancedPrompt = `You are a professional social media content creator. Generate an engaging Facebook post based on the following:

Category: ${category || 'General'}
Prompt: ${prompt}

Requirements:
- Keep it conversational and engaging
- Make it suitable for Facebook audience
- Include relevant hashtags if appropriate
- Do NOT use asterisks (*) or special formatting characters
- Keep it concise but compelling (150-300 words)
- Make it sound natural and human-like
- Focus on value and engagement

Generate only the post content, nothing else:`;

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const generatedContent = response.text();

      if (!generatedContent) {
        throw new Error('No content generated from Gemini');
      }

      // Remove any asterisks or special formatting characters
      const cleanContent = generatedContent
        .replace(/\*/g, '')
        .replace(/#{2,}/g, '#')
        .trim();

      return cleanContent;

    } catch (error: unknown) {
      const geminiError = error as Error & { status?: number };
      console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, geminiError);
      
      // Check if it's a 503 overload error - check both status and message
      if (geminiError.status === 503 || geminiError.message?.includes('503') || geminiError.message?.includes('overloaded')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('Gemini AI is currently overloaded. Please try again in a few minutes.');
      }
      
      // Check if it's a 429 quota exceeded error
      if (geminiError.status === 429 || geminiError.message?.includes('429') || geminiError.message?.includes('quota') || geminiError.message?.includes('exceeded')) {
        throw new Error('Daily API quota exceeded. Please wait 24 hours for quota reset or upgrade your Google Cloud billing plan.');
      }
      
      throw new Error(`Failed to generate content: ${geminiError.message || 'Unknown error'}`);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Failed to generate content after all retries');
}

// Image Description Generation for Facebook
export async function generateImageDescription(prompt: string, category?: string): Promise<string> {
  const maxRetries = 5;
  const baseDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const imagePrompt = `You are an expert AI image generation specialist. Your task is to create a PRECISE, DETAILED image description that will generate an image EXACTLY matching the user's requirements.

USER PROMPT: "${prompt}"
CATEGORY: ${category || 'General'}

CRITICAL INSTRUCTIONS FOR ACCURATE IMAGE GENERATION:

1. **EXACT SUBJECT MATCHING**: 
   - If user says "red sports car" → describe a RED sports car, not just any car
   - If user says "3 cats" → describe exactly 3 cats, not 1 or 2
   - If user says "blue ice cream" → describe BLUE ice cream, not any color

2. **COLOR SPECIFICITY**:
   - Extract and emphasize ALL colors mentioned (red, blue, green, yellow, orange, purple, pink, black, white, golden, silver)
   - Make colors the PRIMARY visual element when specified
   - If no color is mentioned, use appropriate natural colors

3. **NUMBER ACCURACY**:
   - If numbers are mentioned (1, 2, 3, 4, 5, etc.), specify the EXACT count
   - "3 cats" = "Three cats", "2 dogs" = "Two dogs"

4. **STYLE RECOGNITION**:
   - Identify styles: cinematic, realistic, cartoon, minimalist, vintage, modern, professional
   - Apply the style consistently throughout the description

5. **NEGATIVE PROMPTS**:
   - Respect negative instructions: "no people" = no humans visible
   - "no text" = no written text or signs
   - "no background" = clean, minimal background

6. **COMPOSITION DETAILS**:
   - Include composition: close-up, wide shot, 16:9 aspect ratio, square, portrait
   - Specify camera angles and framing when relevant

7. **CONTEXT AND SETTING**:
   - Include relevant context: indoor/outdoor, time of day, weather, location
   - Add appropriate lighting: natural, artificial, dramatic, soft

8. **QUALITY SPECIFICATIONS**:
   - Use professional photography terms
   - Specify image quality: high-resolution, sharp focus, professional lighting
   - Include relevant details: materials, textures, finishes

EXAMPLES OF ACCURATE DESCRIPTIONS:

Input: "red sports car, no people, cinematic 16:9"
Output: "A sleek red sports car with glossy paint and chrome accents, parked on a modern city street, cinematic lighting with dramatic shadows, 16:9 aspect ratio, no people visible, professional automotive photography style, high-resolution image"

Input: "3 cats sitting on a wooden bench"
Output: "Three cats of different colors sitting together on a rustic wooden bench, natural outdoor lighting, realistic style, no people, peaceful garden setting, high-quality photography"

Input: "blue ice cream cone with sprinkles"
Output: "A bright blue ice cream cone topped with colorful sprinkles, appetizing presentation, no people, high-quality food photography, clean background, professional lighting"

Input: "modern office with laptop and coffee"
Output: "A modern office workspace featuring a sleek laptop and steaming cup of coffee, clean minimalist design, natural lighting, no people visible, professional interior photography"

GENERATE A DETAILED, SPECIFIC DESCRIPTION (50-80 words) that will create an image EXACTLY matching the user's prompt. Focus on precision and accuracy.`;

      const result = await model.generateContent(imagePrompt);
      const response = await result.response;
      const imageDescription = response.text();

      if (!imageDescription) {
        throw new Error('No image description generated');
      }

      const cleanDescription = imageDescription.trim();
      console.log('Generated image description:', cleanDescription);
      return cleanDescription;

    } catch (error: unknown) {
      const geminiError = error as Error & { status?: number };
      console.error(`Gemini Image Description Error (attempt ${attempt}/${maxRetries}):`, geminiError);
      
      // Check if it's a 503 overload error - check both status and message
      if (geminiError.status === 503 || geminiError.message?.includes('503') || geminiError.message?.includes('overloaded')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying image description in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Return a fallback description based on the prompt instead of throwing error
        console.log('Gemini AI overloaded, using fallback image description');
        return generateFallbackImageDescription(prompt, category);
      }
      
      // Check if it's a 429 quota exceeded error
      if (geminiError.status === 429 || geminiError.message?.includes('429') || geminiError.message?.includes('quota') || geminiError.message?.includes('exceeded')) {
        console.log('Gemini API quota exceeded, using fallback image description');
        return generateFallbackImageDescription(prompt, category);
      }
      
      throw new Error(`Failed to generate image description: ${geminiError.message || 'Unknown error'}`);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Failed to generate image description after all retries');
}

// Smart fallback image description generator when Gemini is overloaded
function generateFallbackImageDescription(prompt: string, category?: string): string {
  const cleanPrompt = prompt.toLowerCase().trim();
  
  // Extract key elements from the prompt
  const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'golden', 'silver'];
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const styles = ['cinematic', 'realistic', 'cartoon', 'minimalist', 'vintage', 'modern'];
  const compositions = ['close-up', 'wide shot', '16:9', 'square', 'portrait'];
  
  let extractedColor = '';
  let extractedNumber = '';
  let extractedStyle = 'realistic';
  let extractedComposition = '';
  let hasNegativePrompt = false;
  
  // Extract color
  for (const color of colors) {
    if (cleanPrompt.includes(color)) {
      extractedColor = color;
      break;
    }
  }
  
  // Extract number
  for (const number of numbers) {
    if (cleanPrompt.includes(number)) {
      extractedNumber = number;
      break;
    }
  }
  
  // Extract style
  for (const style of styles) {
    if (cleanPrompt.includes(style)) {
      extractedStyle = style;
      break;
    }
  }
  
  // Extract composition
  for (const comp of compositions) {
    if (cleanPrompt.includes(comp)) {
      extractedComposition = comp;
      break;
    }
  }
  
  // Check for negative prompts
  if (cleanPrompt.includes('no people') || cleanPrompt.includes('no person')) {
    hasNegativePrompt = true;
  }
  
  // Enhanced keyword detection with specific descriptions
  const keywordDescriptions: { [key: string]: string } = {
    // Animals with specific details
    'camel': `A majestic ${extractedColor || 'golden'} camel standing in desert sand dunes under clear blue sky, ${extractedStyle} photography, ${hasNegativePrompt ? 'no people visible' : ''}`,
    'horse': `A beautiful ${extractedColor || ''} horse running freely in an open green meadow, natural lighting, ${extractedStyle} style, ${hasNegativePrompt ? 'no people' : ''}`,
    'dog': `A friendly ${extractedColor || ''} dog sitting in a sunny park with green grass, natural lighting, ${extractedStyle} photography, ${hasNegativePrompt ? 'no people' : ''}`,
    'cat': `A cute ${extractedColor || ''} cat sitting peacefully in a cozy indoor setting, warm lighting, ${extractedStyle} style, ${hasNegativePrompt ? 'no people' : ''}`,
    'cats': `${extractedNumber || 'A'} cat${extractedNumber ? 's' : ''} sitting together on a wooden bench, natural lighting, ${extractedStyle} style, ${hasNegativePrompt ? 'no people' : ''}`,
    'elephant': `A majestic elephant in natural habitat, ${extractedStyle} wildlife photography, ${hasNegativePrompt ? 'no people visible' : ''}`,
    'lion': `A powerful lion in natural setting, ${extractedStyle} wildlife photography, ${hasNegativePrompt ? 'no people visible' : ''}`,
    
    // Food with specific details
    'ice cream': `Colorful ${extractedColor || ''} ice cream scoops in a waffle cone on a bright background, appetizing presentation, ${hasNegativePrompt ? 'no people' : ''}, high-quality food photography`,
    'pizza': `A delicious ${extractedColor || ''} pizza with fresh toppings on a wooden table, appetizing presentation, ${hasNegativePrompt ? 'no people' : ''}, professional food photography`,
    'burger': `A gourmet ${extractedColor || ''} burger with fresh ingredients on a rustic plate, appetizing presentation, ${hasNegativePrompt ? 'no people' : ''}, high-quality food photography`,
    'cake': `An elegant ${extractedColor || ''} cake with beautiful decorations on a white background, professional presentation, ${hasNegativePrompt ? 'no people' : ''}, high-quality photography`,
    'coffee': `A steaming cup of ${extractedColor || ''} coffee with latte art on a wooden table, warm lighting, ${hasNegativePrompt ? 'no people' : ''}, professional photography`,
    
    // Vehicles with specific details
    'car': `A ${extractedColor || 'modern'} car in a clean setting, professional photography, ${hasNegativePrompt ? 'no people visible' : ''}`,
    'sports car': `A sleek ${extractedColor || 'red'} sports car with glossy paint, parked on a modern city street, ${extractedStyle} lighting, ${hasNegativePrompt ? 'no people visible' : ''}, professional automotive photography`,
    
    // Technology
    'phone': `A ${extractedColor || 'modern'} smartphone on a clean surface, modern design, ${hasNegativePrompt ? 'no people' : ''}, professional product photography`,
    'laptop': `A ${extractedColor || 'modern'} laptop on a clean desk, modern technology, ${hasNegativePrompt ? 'no people' : ''}, professional photography`,
    
    // Business and Technology
    'business': `Professional business meeting in a modern office setting, clean and organized, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} style`,
    'technology': `Modern technology devices and digital interfaces, clean design, ${hasNegativePrompt ? 'no people' : ''}, professional photography`,
    'office': `Modern office environment with clean design, ${hasNegativePrompt ? 'no people visible' : ''}, professional photography`,
    
    // Nature and Travel
    'nature': `Beautiful natural landscape with vibrant colors, ${hasNegativePrompt ? 'no people visible' : ''}, professional nature photography`,
    'beach': `Pristine beach with clear water and golden sand, ${hasNegativePrompt ? 'no people visible' : ''}, professional landscape photography`,
    'mountain': `Majestic mountain landscape with dramatic lighting, ${hasNegativePrompt ? 'no people visible' : ''}, professional nature photography`,
    'travel': `Beautiful travel destination with stunning natural scenery, ${hasNegativePrompt ? 'no people visible' : ''}, professional photography`,
    'sunset': `Breathtaking ${extractedColor || 'golden'} sunset over a beautiful landscape, warm lighting, ${hasNegativePrompt ? 'no people visible' : ''}, professional photography`,
    
    // Health and Fitness
    'fitness': `Modern gym equipment in a bright, clean gym environment, ${hasNegativePrompt ? 'no people visible' : ''}, professional photography`,
    'yoga': `Yoga mat and props in a peaceful setting, natural lighting, ${hasNegativePrompt ? 'no people' : ''}, calming atmosphere`,
    'health': `Medical equipment in a clean healthcare setting, professional environment, ${hasNegativePrompt ? 'no people visible' : ''}`
  };
  
  // Find matching description with enhanced keyword detection
  for (const [keyword, description] of Object.entries(keywordDescriptions)) {
    if (cleanPrompt.includes(keyword)) {
      return description;
    }
  }
  
  // Category-based fallback with more specific descriptions
  const categoryDescriptions: { [key: string]: string } = {
    'Business & Marketing': `Professional business presentation in a modern office environment, clean design, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} photography`,
    'Technology & Innovation': `Cutting-edge technology and digital innovation concepts, modern design, ${hasNegativePrompt ? 'no people' : ''}, ${extractedStyle} photography`,
    'Health & Wellness': `Healthy lifestyle and wellness activities in natural setting, clean design, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} photography`,
    'Lifestyle & Travel': `Beautiful travel destination with stunning natural scenery, ${hasNegativePrompt ? 'no people visible' : ''}, professional landscape photography`,
    'Food & Cooking': `Delicious, fresh food beautifully arranged and presented, appetizing presentation, ${hasNegativePrompt ? 'no people' : ''}, professional food photography`,
    'Education & Learning': `Learning environment with books and educational materials, clean and organized, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} photography`,
    'Entertainment & Fun': `Fun, colorful entertainment and recreational activities, vibrant design, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} photography`,
    'Sports & Fitness': `Athletic activities and fitness training equipment, modern gym environment, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} photography`,
    'Fashion & Beauty': `Stylish fashion and beauty products in elegant setting, professional presentation, ${hasNegativePrompt ? 'no people visible' : ''}, high-quality photography`
  };
  
  return categoryDescriptions[category || 'General'] || `Professional, high-quality image suitable for social media content, clean design, ${hasNegativePrompt ? 'no people visible' : ''}, ${extractedStyle} style`;
}
// Generate placeholder image URL (using a more sophisticated placeholder service)
export async function generateImageUrl(description: string): Promise<string> {
  try {
    // Extract key visual elements from the description for better image matching
    const cleanDescription = description.toLowerCase().trim();
    
    console.log('Image description received:', description);
    console.log('Clean description:', cleanDescription);
    
    // Enhanced keyword detection with priority scoring
    let imageQuery = 'business'; // default fallback
    let matchScore = 0;
    
          // Define keyword categories with scoring for better matching
      const keywordCategories = {
        // Animals (high specificity) - exact matches
        'camel': ['camel', 'desert animal', 'dromedary', 'hump'],
        'horse': ['horse', 'equine', 'stallion', 'mare', 'pony'],
        'dog': ['dog', 'canine', 'puppy', 'pet dog', 'domestic dog'],
        'cat': ['cat', 'feline', 'kitten', 'pet cat', 'domestic cat'],
        'cats': ['cats', 'felines', 'kittens', 'multiple cats'],
        'elephant': ['elephant', 'safari', 'trunk', 'tusks', 'african elephant'],
        'lion': ['lion', 'big cat', 'wildlife', 'mane', 'king of jungle'],
      
      // Food & Beverages (high specificity)
      'ice-cream': ['ice cream', 'icecream', 'frozen dessert', 'gelato', 'sorbet'],
      'pizza': ['pizza', 'italian food', 'slice', 'pepperoni', 'margherita'],
      'burger': ['burger', 'hamburger', 'fast food', 'cheeseburger', 'sandwich'],
      'cake': ['cake', 'dessert', 'bakery', 'birthday cake', 'wedding cake'],
      'coffee': ['coffee', 'cafe', 'beverage', 'espresso', 'latte', 'cappuccino'],
      'food': ['meal', 'restaurant', 'dining', 'cuisine', 'dish'],
      
      // Business & Technology (medium specificity)
      'business': ['business', 'office', 'corporate', 'professional', 'meeting', 'workplace'],
      'technology': ['technology', 'tech', 'digital', 'software', 'innovation', 'startup'],
      'computer': ['computer', 'laptop', 'pc', 'desktop', 'workstation'],
      'smartphone': ['phone', 'mobile', 'smartphone', 'device', 'iphone', 'android'],
      'car': ['car', 'automobile', 'vehicle', 'sports car', 'sedan', 'suv'],
      'sports-car': ['sports car', 'sportscar', 'fast car', 'luxury car', 'supercar'],
      
      // Nature & Travel (medium specificity)
      'nature': ['nature', 'forest', 'outdoor', 'environment', 'wilderness', 'trees'],
      'beach': ['beach', 'ocean', 'sea', 'coastal', 'waves', 'sand'],
      'mountain': ['mountain', 'hiking', 'peak', 'landscape', 'summit', 'alpine'],
      'travel': ['travel', 'vacation', 'tourism', 'journey', 'adventure', 'destination'],
      'sunset': ['sunset', 'sunrise', 'sky', 'horizon', 'golden hour', 'dusk'],
      
      // Health & Fitness (medium specificity)
      'fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'bodybuilding'],
      'yoga': ['yoga', 'meditation', 'wellness', 'mindfulness', 'zen', 'namaste'],
      'health': ['health', 'medical', 'healthcare', 'doctor', 'hospital', 'wellness']
    };
    
    // Score-based matching for better accuracy
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      let categoryScore = 0;
      for (const keyword of keywords) {
        if (cleanDescription.includes(keyword)) {
          // Give higher scores for exact matches and longer keywords
          categoryScore += keyword.length * 2;
          if (cleanDescription.startsWith(keyword) || cleanDescription.includes(` ${keyword} `)) {
            categoryScore += 10; // Bonus for word boundaries
          }
        }
      }
      
      if (categoryScore > matchScore) {
        matchScore = categoryScore;
        imageQuery = category;
      }
    }
    
    // Additional context-based refinements
    if (matchScore === 0) {
      // If no specific match, try to infer from context
      if (cleanDescription.includes('product') || cleanDescription.includes('service') || cleanDescription.includes('company')) {
        imageQuery = 'business';
      } else if (cleanDescription.includes('food') || cleanDescription.includes('eat') || cleanDescription.includes('taste')) {
        imageQuery = 'food';
      } else if (cleanDescription.includes('outdoor') || cleanDescription.includes('natural') || cleanDescription.includes('green')) {
        imageQuery = 'nature';
      } else if (cleanDescription.includes('digital') || cleanDescription.includes('online') || cleanDescription.includes('app')) {
        imageQuery = 'technology';
      }
    }
    
    console.log('Selected image query:', imageQuery, 'with score:', matchScore);
    
    // Enhanced image mappings with higher quality, more diverse images
    const imageMap: { [key: string]: string[] } = {
      // Animals - Multiple options for variety
      'camel': [
        'https://images.pexels.com/photos/2295744/pexels-photo-2295744.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1598073/pexels-photo-1598073.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'horse': [
        'https://images.pexels.com/photos/635499/pexels-photo-635499.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'dog': [
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'cat': [
        'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'cats': [
        'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/96938/pexels-photo-96938.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'elephant': [
        'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'lion': [
        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Food - Multiple high-quality options
      'ice-cream': [
        'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'pizza': [
        'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'burger': [
        'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'cake': [
        'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'coffee': [
        'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'food': [
        'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Business & Technology - Professional, diverse options
      'business': [
        'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'technology': [
        'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'computer': [
        'https://images.pexels.com/photos/205316/pexels-photo-205316.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'smartphone': [
        'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'car': [
        'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'sports-car': [
        'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Nature & Travel - Stunning, high-quality landscapes
      'nature': [
        'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'beach': [
        'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'mountain': [
        'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'travel': [
        'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'sunset': [
        'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      
      // Health & Fitness - Motivational, high-quality images
      'fitness': [
        'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'yoga': [
        'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ],
      'health': [
        'https://images.pexels.com/photos/40751/doctor-medical-medicine-health-40751.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
        'https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
      ]
    };
    
    // Select image with variety (rotate through available options)
    const availableImages = imageMap[imageQuery] || imageMap['business'];
    const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    
    console.log('Final selected image URL:', selectedImage);
    return selectedImage;
    
  } catch (error: unknown) {
    console.error('Image Generation Error:', error);
    // Return a reliable fallback image from Pexels
    return 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
  }
}

// Facebook Graph API Publishing with Image
import { publishToFacebook } from './facebook';

export const publishToFacebookWithImage = publishToFacebook;

// Combined function to generate content, image, and publish
export async function generateAndPublishComplete(
  prompt: string, 
  category: string,
  pageId: string, 
  accessToken: string
): Promise<{ 
  success: boolean; 
  content?: string; 
  imageUrl?: string;
  imageDescription?: string;
  postId?: string; 
  error?: string 
}> {
  try {
    // Step 1: Generate post content
    const content = await generatePostContent(prompt, category);
    
    // Step 2: Generate image description
    const imageDescription = await generateImageDescription(prompt, category);
    
    // Step 3: Generate image URL
    const imageUrl = await generateImageUrl(imageDescription);
    
    // Step 4: Publish to Facebook with image
    const publishResult = await publishToFacebook(content, imageUrl, pageId, accessToken);
    
    if (publishResult.success) {
      return {
        success: true,
        content,
        imageUrl,
        imageDescription,
        postId: publishResult.postId
      };
    } else {
      return {
        success: false,
        content,
        imageUrl,
        imageDescription,
        error: publishResult.error
      };
    }
  } catch (error: unknown) {
    const geminiError = error as Error & { status?: number };
    return {
      success: false,
      error: geminiError.message || 'Failed to generate and publish content'
    };
  }
}