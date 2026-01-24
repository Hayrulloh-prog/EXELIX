"use client";
import React, { useState } from "react";

export default function TestQRPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const apiBase =
    (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:3001";
  // Normalize API base so we don't accidentally double "/api/v1"
  const _base = apiBase.replace(/\/$/, "");
  const apiPrefix = _base.endsWith("/api/v1") ? _base : `${_base}/api/v1`;

  async function handleCreateToken() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiPrefix}/qr/debug/create`, {
        method: "POST",
      });
      if (res.status === 403) {
        setResult({ error: "Debug endpoint disabled on server" });
        return;
      }
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setResult({ created: true, token: data.token });
      } else {
        setResult({ error: "Unexpected response", body: data });
      }
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiPrefix}/qr/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setResult({ status: res.status, body: data });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">QR Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
            placeholder="paste QR token here"
          />
        </div>
        <div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            disabled={loading}
          >
            {loading ? "Checking..." : "Validate"}
          </button>
          <button
            type="button"
            onClick={handleCreateToken}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Working..." : "Create token"}
          </button>
        </div>
      </form>

      {result && (
        <pre className="mt-6 bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
