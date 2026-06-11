/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArrowLeft,
  Music2,
  DollarSign,
  Play,
  Tag,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLabelSongs } from '../../../hooks/useLabels';
import Loading from '../../../components/loading/loading';
import { useState, useMemo } from 'react';

type SortField = 'title' | 'streams' | 'revenue';
type SortDir = 'asc' | 'desc';

export default function LabelDetail() {
  const { label } = useParams<{ label: string }>();
  const navigate = useNavigate();
  const { songs, loading, error } = useLabelSongs(label || '');

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const decodedLabel = decodeURIComponent(label || '');

  const totalNetIncome = songs.reduce((sum, song) => sum + (song.totalNetIncome || 0), 0);
  const totalStreams = songs.reduce((sum, song) => sum + (song.totalStreams || 0), 0);

  // Ganancia del owner: viene precalculada por canción desde el backend
  // (totalNetIncome * % general del ownerSplit). Aquí solo se totaliza.
  const totalOwnerEarnings = songs.reduce(
    (sum, song) => sum + (song.ownerEarnings || 0),
    0
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? songs.filter(
          (s) =>
            s.trackTitle?.toLowerCase().includes(q) ||
            s.artistName?.toLowerCase().includes(q) ||
            s.isrc?.toLowerCase().includes(q)
        )
      : [...songs];

    filtered.sort((a, b) => {
      let diff = 0;
      if (sortField === 'title') {
        diff = (a.trackTitle || '').localeCompare(b.trackTitle || '');
      } else if (sortField === 'streams') {
        diff = (a.totalStreams || 0) - (b.totalStreams || 0);
      } else {
        diff = (a.totalNetIncome || 0) - (b.totalNetIncome || 0);
      }
      return sortDir === 'asc' ? diff : -diff;
    });

    return filtered;
  }, [songs, search, sortField, sortDir]);

  const formatStreams = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-[#F97316]" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-[#F97316]" />
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-6 lg:px-10 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/panel/labels')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Sello</h1>
            <p className="text-sm text-gray-500 mt-0.5">Canciones y métricas del sello</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/panel/labels" className="text-gray-400 hover:text-gray-600">
            Labels
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[180px]">{decodedLabel}</span>
        </div>
      </div>

      {/* Label identity */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Tag className="w-7 h-7 text-[#F97316]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{decodedLabel || 'Sin Label'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'} registradas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Music2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Canciones</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{songs.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Ingresos Total</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNetIncome)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Streams</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatStreams(totalStreams)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#F97316]" />
            </div>
            <span className="text-xs font-medium text-gray-500">Ganancias del Owner</span>
          </div>
          <p className="text-2xl font-bold text-[#F97316]">{formatCurrency(totalOwnerEarnings)}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Canciones</span>
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
              {filteredSongs.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, artista, ISRC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        {filteredSongs.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                  >
                    Canción
                    <SortIcon field="title" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ISRC
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('streams')}
                    className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                  >
                    Streams
                    <SortIcon field="streams" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('revenue')}
                    className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                  >
                    Ingresos
                    <SortIcon field="revenue" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Split Owner
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSongs.map((song) => {
                const ownerPct = song.ownerSplit?.percentage ?? null;

                return (
                  <tr
                    key={song._id}
                    onClick={() => navigate(`/panel/song/${song._id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Song */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {song.spotifyData?.album?.images?.[0]?.url ? (
                          <img
                            src={song.spotifyData.album.images[0].url}
                            alt={song.trackTitle}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-4 h-4 text-[#F97316]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {song.trackTitle}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{song.artistName}</p>
                        </div>
                      </div>
                    </td>

                    {/* ISRC */}
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-gray-500">
                        {song.isrc || '—'}
                      </span>
                    </td>

                    {/* Streams */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatStreams(song.totalStreams || 0)}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(song.totalNetIncome || 0)}
                      </span>
                    </td>

                    {/* Split Owner */}
                    <td className="px-4 py-4">
                      {ownerPct !== null ? (
                        <span className="inline-flex px-2.5 py-1 bg-orange-50 text-[#F97316] text-xs font-semibold rounded-full">
                          {ownerPct}%
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-400 text-xs font-semibold rounded-full">
                          Sin split
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <Music2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {search ? 'Sin resultados' : 'No hay canciones'}
            </p>
            <p className="text-xs text-gray-400 max-w-xs">
              {search
                ? `No se encontraron canciones para "${search}"`
                : 'No hay canciones registradas para este sello'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-xs font-medium text-[#F97316] hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
