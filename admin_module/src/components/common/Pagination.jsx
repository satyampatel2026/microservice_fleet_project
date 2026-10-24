export default function Pagination({
  page,
  totalPages,
  onPageChange,
}) {

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Page{" "}
        <span className="font-medium text-gray-900">
          {page}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900">
          {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() =>
            onPageChange(page - 1)
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() =>
            onPageChange(page + 1)
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
