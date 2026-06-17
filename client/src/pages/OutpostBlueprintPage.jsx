import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { getSession } from "../session";

const categories = [
  "All Categories",
  "Safe Zone",
  "Command Zone",
  "Activity Zone",
  "Research Zone",
  "Service Zone",
  "Emergency Zone",
  "Restricted Access",
  "Restricted Boundary",
  "Access Point",
  "Gathering Zone"
];

const emptyMarker = {
  name: "",
  description: "",
  category: "Activity Zone",
  xPosition: 50,
  yPosition: 50,
  accessLevel: "All participants",
  safetyNote: "",
  isVisible: true,
  leaderOnly: false,
  relatedSession: ""
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCategoryClass(category) {
  return `map-marker marker-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function OutpostBlueprintPage({ mode = "viewer" }) {
  const isLeaderMode = mode === "leader";
  const mapRef = useRef(null);
  const session = getSession();
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(emptyMarker);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [message, setMessage] = useState("");

  function refresh() {
    api.getCampMap(isLeaderMode ? "leader" : "viewer").then((nextPayload) => {
      setPayload(nextPayload);
      if (!selected && nextPayload.locations.length) {
        setSelected(nextPayload.locations[0]);
        setDraft(nextPayload.locations[0]);
      }
    });
  }

  useEffect(() => {
    refresh();
  }, [isLeaderMode]);

  const visibleLocations = useMemo(() => {
    if (!payload) {
      return [];
    }

    return payload.locations.filter((location) => (
      categoryFilter === "All Categories" || location.category === categoryFilter
    ));
  }, [categoryFilter, payload]);

  function selectLocation(location) {
    setSelected(location);
    setDraft(location);
    setMessage("");
  }

  function getPointFromEvent(event) {
    const rect = mapRef.current.getBoundingClientRect();
    return {
      xPosition: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      yPosition: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    };
  }

  async function handleMapClick(event) {
    if (!isLeaderMode || event.target.closest("button")) {
      return;
    }

    const point = getPointFromEvent(event);
    const nextDraft = {
      ...emptyMarker,
      ...point,
      name: "New Outpost Marker"
    };
    setSelected(null);
    setDraft(nextDraft);
    setMessage("New marker position selected. Complete the form and save.");
  }

  async function handleDragEnd(event, location) {
    if (!isLeaderMode) {
      return;
    }

    const point = getPointFromEvent(event);
    const response = await api.updateMapLocation(location.id, {
      ...location,
      ...point
    });
    setSelected(response.location);
    setDraft(response.location);
    refresh();
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const imageUrl = await readFileAsDataUrl(file);
    await api.updateCampMap({
      imageUrl,
      updatedBy: session?.displayName || "Outpost Command"
    });
    setMessage("Blueprint image updated.");
    refresh();
  }

  async function saveMarker(event) {
    event.preventDefault();
    const saveAction = draft.id
      ? api.updateMapLocation(draft.id, draft)
      : api.createMapLocation(draft);
    const response = await saveAction;
    setSelected(response.location);
    setDraft(response.location);
    setMessage("Marker saved.");
    refresh();
  }

  async function deleteMarker() {
    if (!draft.id || !window.confirm("Delete this map marker?")) {
      return;
    }

    await api.deleteMapLocation(draft.id);
    setSelected(null);
    setDraft(emptyMarker);
    setMessage("Marker deleted.");
    refresh();
  }

  async function resetMarkers() {
    if (!window.confirm("Reset all markers to default blueprint positions?")) {
      return;
    }

    const nextPayload = await api.resetMapLocations();
    setPayload(nextPayload);
    setSelected(nextPayload.locations[0] || null);
    setDraft(nextPayload.locations[0] || emptyMarker);
    setMessage("Markers reset to default positions.");
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  if (!payload) {
    return <div className="notice">Loading Outpost Blueprint...</div>;
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Outpost Blueprint</p>
      <h1>{payload.map?.title || "The Last Outpost Blueprint"}</h1>
      <p className="lead">
        {payload.map?.widthMeters}m wide. Left depth {payload.map?.leftDepthMeters}m, right depth {payload.map?.rightDepthMeters}m.
        {" "}{payload.map?.scaleDescription}.
      </p>

      <div className="blueprint-layout">
        <div>
          <div className="filter-bar">
            <label className="field">
              <span>Marker category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            {payload.map?.imageUrl ? (
              <a className="button quiet" href={payload.map.imageUrl} target="_blank" rel="noreferrer">View Full Blueprint</a>
            ) : null}
          </div>

          <div className="blueprint-card">
            {payload.map?.imageUrl ? (
              <div ref={mapRef} className="blueprint-stage" onClick={handleMapClick}>
                <img src={payload.map.imageUrl} alt="The Last Outpost blueprint" />
                {visibleLocations.map((location) => (
                  <button
                    aria-label={location.name}
                    className={getCategoryClass(location.category)}
                    draggable={isLeaderMode}
                    key={location.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectLocation(location);
                    }}
                    onDragEnd={(event) => handleDragEnd(event, location)}
                    style={{ left: `${location.xPosition}%`, top: `${location.yPosition}%` }}
                    title={`${location.name} - ${location.category}`}
                    type="button"
                  />
                ))}
              </div>
            ) : (
              <div className="blueprint-empty">
                <h2>Outpost blueprint has not yet been uploaded by Command.</h2>
                <p>Leaders can upload the provided blueprint image from the management panel.</p>
              </div>
            )}
          </div>

          {!visibleLocations.length ? (
            <article className="info-card">
              <h2>No Outpost zones are currently available.</h2>
              <p>Change the filter or ask Outpost Command to show map markers.</p>
            </article>
          ) : null}

          <div className="legend-grid">
            {categories.filter((category) => category !== "All Categories").map((category) => (
              <span key={category}><i className={getCategoryClass(category)} /> {category}</span>
            ))}
          </div>
        </div>

        <aside className="map-side-panel">
          {isLeaderMode ? (
            <div className="form-card">
              <h2>Blueprint Management</h2>
              <label className="field">
                <span>Upload or replace blueprint image</span>
                <input accept="image/*" type="file" onChange={handleImageUpload} />
              </label>
              <form className="stack-form" onSubmit={saveMarker}>
                <label className="field"><span>Name</span><input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} /></label>
                <label className="field"><span>Category</span><select value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}>{categories.filter((category) => category !== "All Categories").map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="field"><span>Access level</span><input value={draft.accessLevel} onChange={(event) => updateDraft("accessLevel", event.target.value)} /></label>
                <label className="field"><span>Description</span><textarea rows="4" value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
                <label className="field"><span>Safety note</span><textarea rows="3" value={draft.safetyNote} onChange={(event) => updateDraft("safetyNote", event.target.value)} /></label>
                <div className="form-grid">
                  <label className="field"><span>X %</span><input min="0" max="100" type="number" value={Number(draft.xPosition).toFixed(1)} onChange={(event) => updateDraft("xPosition", event.target.value)} /></label>
                  <label className="field"><span>Y %</span><input min="0" max="100" type="number" value={Number(draft.yPosition).toFixed(1)} onChange={(event) => updateDraft("yPosition", event.target.value)} /></label>
                </div>
                <label className="check-row"><input checked={draft.isVisible} type="checkbox" onChange={(event) => updateDraft("isVisible", event.target.checked)} /> Show marker to users</label>
                <label className="check-row"><input checked={draft.leaderOnly} type="checkbox" onChange={(event) => updateDraft("leaderOnly", event.target.checked)} /> Leader-only marker</label>
                {message ? <p className="success-text">{message}</p> : null}
                <div className="button-row">
                  <button className="button warning" type="submit">Save</button>
                  <button className="button quiet" type="button" onClick={() => { setSelected(null); setDraft(emptyMarker); }}>Cancel</button>
                  {draft.id ? <button className="button quiet" type="button" onClick={deleteMarker}>Delete</button> : null}
                  <button className="button quiet" type="button" onClick={resetMarkers}>Reset Markers</button>
                </div>
              </form>
            </div>
          ) : (
            <MarkerInfoCard location={selected} />
          )}
        </aside>
      </div>
    </section>
  );
}

function MarkerInfoCard({ location }) {
  if (!location) {
    return (
      <article className="info-card">
        <h2>Select a marker</h2>
        <p>Tap a visible Outpost zone to view its access level and safety information.</p>
      </article>
    );
  }

  return (
    <article className="info-card">
      <p className="eyebrow">{location.category}</p>
      <h2>{location.name}</h2>
      <p>{location.description}</p>
      <p><strong>Access:</strong> {location.accessLevel}</p>
      {location.safetyNote ? <p><strong>Safety:</strong> {location.safetyNote}</p> : null}
      {location.relatedSession ? <p><strong>Session:</strong> {location.relatedSession}</p> : null}
    </article>
  );
}
