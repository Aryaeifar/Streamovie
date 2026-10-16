import { MediaDetails } from "@/components/media/media-details";

export default async function SeriesDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) return <MediaDetails kind="series" mediaId={-1} />;
  return <MediaDetails kind="series" mediaId={mediaId} />;
}
