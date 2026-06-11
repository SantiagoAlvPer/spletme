/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import songs from '../services/songs';

/**
 * Carga una canción y expone helpers para leer los splits (owner y colaboradores)
 * con sus montos calculados EN VIVO por el backend (campo amountOwed) y su
 * porcentaje (split.percentage del modelo SongSplit).
 */
const UseSong = ({ id }: { id: string }) => {
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getSong = async (songId: string) => {
    setLoading(true);
    const response = await songs.getSong(songId);
    setSong(response.data);
    setLoading(false);
  };

  const getOwnerId = () => song?.ownerId || null;

  const getOwnerPercentage = () => {
    const owner = getOwnerId();
    return owner?.split?.percentage || 0;
  };

  const getOwnerTotalOwed = () => {
    const owner = getOwnerId();
    return owner?.amountOwed || 0;
  };

  const getOwnerInfo = () => {
    const owner = getOwnerId();
    if (!owner) return null;

    const percentage = owner.split?.percentage || 0;
    const amountOwed = owner.amountOwed || 0;

    return {
      id: owner._id || owner.id,
      mongoId: owner._id,
      shortId: owner.id,
      username: owner.username,
      percentage: percentage.toFixed(2),
      amountToPay: amountOwed.toFixed(2),
      calculatedAmount: amountOwed,
      split: owner.split || null,
      rawData: owner,
    };
  };

  const getCollaboratorsWithPercentages = () => {
    if (!song?.collaborators || song.collaborators.length === 0) return [];

    return song.collaborators.map((collaborator: any) => {
      const percentage = collaborator.split?.percentage || 0;
      const amountOwed = collaborator.amountOwed || 0;

      return {
        ...collaborator,
        percentage: percentage.toFixed(2),
        amountToPay: amountOwed.toFixed(2),
        calculatedAmount: amountOwed,
      };
    });
  };

  const getCollaboratorsInfo = () => getCollaboratorsWithPercentages();

  useEffect(() => {
    getSong(id);
  }, [id]);

  return {
    song,
    getSong,
    getOwnerId,
    getOwnerPercentage,
    getOwnerInfo,
    getOwnerTotalOwed,
    loading,
    getCollaboratorsWithPercentages,
    getCollaboratorsInfo,
  };
};

export default UseSong;
