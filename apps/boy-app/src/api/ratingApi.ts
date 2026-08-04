import apiClient from "./apiClient";

export const submitRating = async (
  targetUserId: string,
  chatId: string,
  score: number,
  review?: string,
) => {
  const response = await apiClient.post("/ratings", {
    targetUserId,
    chatId,
    score,
    review,
  });
  return response.data;
};

export const updateRating = async (
  ratingId: string,
  score: number,
  comment?: string,
) => {
  const response = await apiClient.patch(`/ratings/${ratingId}`, {
    score,
    comment,
  });
  return response.data;
};

export const getRatings = async (
  targetUserId: string,
  page = 1,
  limit = 20,
) => {
  const response = await apiClient.get("/ratings", {
    params: { targetUserId, page, limit },
  });
  return response.data;
};
