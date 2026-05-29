// Comment/review system for products
// Comments are shared across all variants of the same product
import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

export interface Review {
  id: string;
  productId: string; // Product ID (not variant ID)
  title: string;
  rating: number; // 1-5 stars
  content: string;
  author: string;
  authorEmail?: string;
  date: string; // Formatted date
  datetime: string; // ISO date string
  verifiedPurchase?: boolean;
  helpful?: number;
  notHelpful?: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// GraphQL queries for review plugin
export const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($productId: ID!, $rating: Int!, $comment: String!, $title: String, $verifiedPurchase: Boolean, $username: String, $useremail: String) {
    addReview(
      productId: $productId
      rating: $rating
      comment: $comment
      title: $title
      verifiedPurchase: $verifiedPurchase
      username: $username
      useremail: $useremail
    ) {
      id
      rating
      title
      comment
      createdAt
      createdByIp
      verifiedPurchase
      helpful
      notHelpful
      username
      useremail
      customer {
        id
        firstName
      }
    }
  }
`;

export const GET_REVIEWS_BY_PRODUCT_QUERY = gql`
  query ReviewsByProduct($productId: ID!, $skip: Int!, $take: Int!) {
    reviewsByProduct(productId: $productId, skip: $skip, take: $take) {
      items {
        id
        rating
        title
        comment
        createdAt
        createdByIp
        verifiedPurchase
        helpful
        notHelpful
        username
        useremail
        customer {
          id
          firstName
        }
      }
      totalCount
    }
  }
`;

export const GET_REVIEW_STATS_QUERY = gql`
  query ReviewStats($productId: ID!) {
    reviewsByProduct(productId: $productId, skip: 0, take: 1000) {
      items {
        rating
      }
      totalCount
    }
  }
`;

// Mutations for marking reviews as helpful/not helpful
export const MARK_REVIEW_HELPFUL_MUTATION = gql`
  mutation MarkReviewHelpful($id: ID!) {
    markReviewHelpful(id: $id)
  }
`;

export const MARK_REVIEW_NOT_HELPFUL_MUTATION = gql`
  mutation MarkReviewNotHelpful($id: ID!) {
    markReviewNotHelpful(id: $id)
  }
`;

// Mock data for development - in production, this would connect to your backend API
const getStoredReviews = (): Review[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('product-reviews');
    if (stored) {
      return JSON.parse(stored);
    }
  }

  // Return initial mock data if no stored reviews
  return [
    {
      id: '1',
      productId: '1',
      title: 'Excellent product!',
      rating: 5,
      content: 'This product exceeded my expectations. The quality is outstanding and it works perfectly.',
      author: 'John D.',
      date: 'May 25, 2024',
      datetime: '2024-05-25',
      verifiedPurchase: true,
      helpful: 12,
      notHelpful: 1
    },
    {
      id: '2',
      productId: '1',
      title: 'Good value for money',
      rating: 4,
      content: 'Works as described. Good quality and fast delivery. Would recommend to others.',
      author: 'Sarah M.',
      date: 'May 24, 2024',
      datetime: '2024-05-24',
      verifiedPurchase: true,
      helpful: 8,
      notHelpful: 0
    },
    {
      id: '3',
      productId: '1',
      title: 'Exactly what I needed',
      rating: 5,
      content: 'Perfect for my requirements. The build quality is excellent and it arrived quickly.',
      author: 'Mike T.',
      date: 'May 23, 2024',
      datetime: '2024-05-23',
      verifiedPurchase: false,
      helpful: 5,
      notHelpful: 0
    }
  ];
};

const saveReviews = (reviews: Review[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('product-reviews', JSON.stringify(reviews));
  }
};

let mockReviews = getStoredReviews();

// Simulate API calls with delays
const simulateApiCall = <T>(data: T, delay = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Get reviews for a product with pagination
export const getReviewsByProductId = async (productId: string, page = 1): Promise<{ items: Review[], totalCount: number }> => {
  try {
    const envPageSize = import.meta.env.VITE_REVIEWS_NUMBER_IN_A_PAGE;
    const pageSize = envPageSize ? parseInt(envPageSize) : 2;
    // console.log('📄 Reviews page size:', pageSize, 'from env:', envPageSize);
    const skip = (page - 1) * pageSize;

    const variables = {
      productId,
      skip,
      take: pageSize
    };

    const data = await graphqlRequest(GET_REVIEWS_BY_PRODUCT_QUERY, variables);

    if (data.reviewsByProduct) {
      // Transform the database response to match our Review interface
      const items = data.reviewsByProduct.items.map((dbReview: any) => ({
        id: dbReview.id,
        productId: productId,
        title: dbReview.title || '',
        rating: dbReview.rating,
        content: dbReview.comment,
        author: dbReview.username || dbReview.customer?.firstName || 'Anonymous',
        authorEmail: dbReview.useremail || dbReview.customer?.emailAddress || '',
        date: new Date(dbReview.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        datetime: dbReview.createdAt.split('T')[0],
        verifiedPurchase: dbReview.verifiedPurchase || false,
        helpful: dbReview.helpful || 0,
        notHelpful: dbReview.notHelpful || 0
      }));

      return {
        items,
        totalCount: data.reviewsByProduct.totalCount
      };
    }

    return { items: [], totalCount: 0 };
  } catch (error) {
    console.error('Error fetching reviews from database:', error);
    // Fallback to mock data if database fails
    const reviews = mockReviews
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      .slice(0, 2); // Limit to 2 for pagination test

    return {
      items: reviews,
      totalCount: reviews.length
    };
  }
};

// Get review statistics for a product
export const getReviewStats = async (productId: string): Promise<ReviewStats> => {
  try {
    const variables = { productId };
    const data = await graphqlRequest(GET_REVIEW_STATS_QUERY, variables);

    if (data.reviewsByProduct) {
      const reviews = data.reviewsByProduct.items;
      const totalReviews = data.reviewsByProduct.totalCount;

      if (totalReviews === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((review: any) => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        averageRating,
        totalReviews,
        ratingDistribution
      };
    }

    // Fallback to mock data if database fails
    const mockReviewsData = mockReviews.filter(review => review.productId === productId);
    if (mockReviewsData.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = mockReviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / mockReviewsData.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mockReviewsData.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating,
      totalReviews: mockReviewsData.length,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error fetching review stats from database:', error);
    // Fallback to mock data
    const mockReviewsData = mockReviews.filter(review => review.productId === productId);
    if (mockReviewsData.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = mockReviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / mockReviewsData.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mockReviewsData.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating,
      totalReviews: mockReviewsData.length,
      ratingDistribution
    };
  }
};

// Submit a new review to database
export const submitReview = async (review: Omit<Review, 'id' | 'date' | 'datetime'>): Promise<Review> => {
  try {
    const variables = {
      productId: review.productId,
      rating: review.rating,
      comment: review.content,
      title: review.title,
      verifiedPurchase: review.verifiedPurchase,
      username: review.author,
      useremail: review.authorEmail
    };

    const data = await graphqlRequest(ADD_REVIEW_MUTATION, variables);

    if (data.addReview) {
      const dbReview = data.addReview;
      // Transform the database response to match our Review interface
      const newReview: Review = {
        id: dbReview.id,
        productId: review.productId,
        title: dbReview.title || review.title || '',
        rating: dbReview.rating,
        content: dbReview.comment,
        author: dbReview.username || dbReview.customer?.firstName || review.author || 'Anonymous',
        authorEmail: dbReview.useremail || review.authorEmail || '',
        date: new Date(dbReview.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        datetime: dbReview.createdAt.split('T')[0],
        verifiedPurchase: dbReview.verifiedPurchase || false,
        helpful: dbReview.helpful || 0,
        notHelpful: dbReview.notHelpful || 0
      };

      return newReview;
    }

    throw new Error('Failed to submit review to database');
  } catch (error) {
    console.error('Error submitting review to database:', error);
    // Fallback to mock data if database fails
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      datetime: new Date().toISOString().split('T')[0]
    };

    mockReviews.push(newReview);
    saveReviews(mockReviews);

    return simulateApiCall(newReview);
  }
};

// Mark review as helpful/not helpful
export const markReviewHelpful = async (reviewId: string, helpful: boolean): Promise<void> => {
  try {
    if (helpful) {
      await graphqlRequest(MARK_REVIEW_HELPFUL_MUTATION, { id: reviewId });
    } else {
      await graphqlRequest(MARK_REVIEW_NOT_HELPFUL_MUTATION, { id: reviewId });
    }
  } catch (error) {
    console.error('Error marking review helpful:', error);
    // Fallback to mock data if database fails
    const review = mockReviews.find(r => r.id === reviewId);
    if (review) {
      if (helpful) {
        review.helpful = (review.helpful || 0) + 1;
      } else {
        review.notHelpful = (review.notHelpful || 0) + 1;
      }
      saveReviews(mockReviews);
    }
  }
  return simulateApiCall(undefined);
};