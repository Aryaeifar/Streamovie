import { MediaDetails } from "@/components/media/media-details";

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) return <MediaDetails kind="movie" mediaId={-1} />;
  return <MediaDetails kind="movie" mediaId={mediaId} />;
}
