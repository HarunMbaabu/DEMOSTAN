(() => {
  const STORAGE_KEY = 'reroute_route_plans';
  const COMPLETIONS_KEY = 'reroute_completions';

  const getRoutes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const setRoutes = (routes) => localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  const getCompletions = () => JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || '[]');
  const setCompletions = (records) => localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(records));
  const page = document.body.dataset.page;

  const generateRouteId = () => `RR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  const statusClass = (status) => {
    if (status === 'Approved') return 'status-approved';
    if (status === 'Rejected') return 'status-rejected';
    if (status === 'Completed') return 'status-completed';
    return 'status-pending';
  };

  if (page === 'route-plan') initRoutePlan();
  if (page === 'dashboard') initDashboard();
  if (page === 'completion') initCompletion();

  function initRoutePlan() {
    const form = document.getElementById('routePlanForm');
    const addBtn = document.getElementById('addCollectionPoint');
    const container = document.getElementById('collectionPointsContainer');
    const template = document.getElementById('collectionPointTemplate');

    const addPoint = () => {
      const frag = template.content.cloneNode(true);
      const article = frag.querySelector('.collection-point');
      article.querySelector('.remove-point').addEventListener('click', () => {
        article.remove();
        refreshPointIndexes();
      });
      container.appendChild(frag);
      refreshPointIndexes();
    };

    const refreshPointIndexes = () => {
      [...container.querySelectorAll('.collection-point')].forEach((point, idx) => {
        point.querySelector('.point-index').textContent = `#${idx + 1}`;
      });
    };

    addBtn.addEventListener('click', addPoint);
    addPoint();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const points = [...container.querySelectorAll('.collection-point')].map((point) => ({
        spaceName: point.querySelector('[name="spaceName"]').value.trim(),
        address: point.querySelector('[name="spaceAddress"]').value.trim(),
        contactPerson: point.querySelector('[name="contactPerson"]').value.trim(),
        contactPhone: point.querySelector('[name="contactPhone"]').value.trim(),
        expectedBottles: Number(point.querySelector('[name="expectedBottles"]').value || 0),
        expectedCullet: Number(point.querySelector('[name="expectedCullet"]').value || 0),
        notes: point.querySelector('[name="pointNotes"]').value.trim()
      }));

      if (!points.length) {
        alert('Please add at least one collection point.');
        return;
      }

      const fd = new FormData(form);
      const routePlan = {
        routeId: generateRouteId(),
        collectorName: fd.get('collectorName').trim(),
        collectorPhone: fd.get('collectorPhone').trim(),
        collectionDate: fd.get('collectionDate'),
        vehicleReg: fd.get('vehicleReg').trim(),
        driverName: fd.get('driverName').trim(),
        routeName: fd.get('routeName').trim(),
        startLocation: fd.get('startLocation').trim(),
        destination: fd.get('destination').trim(),
        estimatedDistance: Number(fd.get('estimatedDistance')),
        estimatedStartTime: fd.get('estimatedStartTime'),
        estimatedEndTime: fd.get('estimatedEndTime'),
        materialType: fd.get('materialType'),
        fuelEstimate: Number(fd.get('fuelEstimate')),
        expectedTotalQuantity: fd.get('expectedTotalQuantity').trim(),
        safetyNotes: fd.get('safetyNotes').trim(),
        additionalRemarks: fd.get('additionalRemarks').trim(),
        collectionPoints: points,
        status: 'Pending Approval',
        createdAt: new Date().toISOString()
      };

      const routes = getRoutes();
      routes.unshift(routePlan);
      setRoutes(routes);
      window.location.href = 'approval-dashboard.html';
    });
  }

  function initDashboard() {
    const summaryCards = document.getElementById('summaryCards');
    const tbody = document.getElementById('routesTableBody');
    const searchInput = document.getElementById('searchRoute');
    const statusFilter = document.getElementById('statusFilter');
    const tableEmpty = document.getElementById('tableEmpty');
    const modal = document.getElementById('routeDetailsModal');
    const closeModal = document.getElementById('closeModal');
    const detailsBody = document.getElementById('routeDetailsBody');

    const metrics = (routes) => ({
      total: routes.length,
      pending: routes.filter((r) => r.status === 'Pending Approval').length,
      approved: routes.filter((r) => r.status === 'Approved').length,
      rejected: routes.filter((r) => r.status === 'Rejected').length,
      completed: routes.filter((r) => r.status === 'Completed').length
    });

    const renderSummary = (routes) => {
      const m = metrics(routes);
      summaryCards.innerHTML = `
        <article class="summary-card"><h4>Total route plans</h4><p>${m.total}</p></article>
        <article class="summary-card"><h4>Pending approvals</h4><p>${m.pending}</p></article>
        <article class="summary-card"><h4>Approved routes</h4><p>${m.approved}</p></article>
        <article class="summary-card"><h4>Rejected routes</h4><p>${m.rejected}</p></article>
        <article class="summary-card"><h4>Completed collections</h4><p>${m.completed}</p></article>
      `;
    };

    const renderDetails = (route) => {
      detailsBody.innerHTML = `
        <section class="form-grid">
          <div><h4>Collector Details</h4><p><strong>Name:</strong> ${route.collectorName}<br><strong>Phone:</strong> ${route.collectorPhone}</p></div>
          <div><h4>Vehicle Details</h4><p><strong>Vehicle:</strong> ${route.vehicleReg}<br><strong>Driver:</strong> ${route.driverName}</p></div>
          <div><h4>Route Details</h4><p><strong>Route:</strong> ${route.routeName}<br><strong>From:</strong> ${route.startLocation}<br><strong>To:</strong> ${route.destination}<br><strong>Date:</strong> ${route.collectionDate}</p></div>
          <div><h4>Expected Quantities</h4><p><strong>Material:</strong> ${route.materialType}<br><strong>Distance:</strong> ${route.estimatedDistance} km<br><strong>Total Qty:</strong> ${route.expectedTotalQuantity}</p></div>
          <div class="full-width"><h4>Safety Notes</h4><p>${route.safetyNotes || '-'}</p></div>
          <div class="full-width"><h4>Additional Remarks</h4><p>${route.additionalRemarks || '-'}</p></div>
          <div class="full-width"><h4>Collection Points</h4>
            ${route.collectionPoints.map((p, i) => `<div class="inner-card"><strong>#${i + 1} ${p.spaceName}</strong> • ${p.address}<br>Contact: ${p.contactPerson} (${p.contactPhone})<br>Expected: ${p.expectedBottles || 0} bottles, ${p.expectedCullet || 0}kg cullet<br>Notes: ${p.notes || '-'}</div>`).join('')}
          </div>
        </section>
      `;
      modal.showModal();
    };

    const setStatus = (routeId, status) => {
      const routes = getRoutes().map((r) => (r.routeId === routeId ? { ...r, status } : r));
      setRoutes(routes);
      render();
    };

    const renderTable = (routes) => {
      const query = searchInput.value.trim().toLowerCase();
      const filter = statusFilter.value;
      const filtered = routes.filter((r) => {
        const matchQuery = !query || [r.routeId, r.collectorName, r.routeName, r.materialType].join(' ').toLowerCase().includes(query);
        const matchStatus = filter === 'all' || r.status === filter;
        return matchQuery && matchStatus;
      });

      tbody.innerHTML = filtered.map((r) => `
        <tr>
          <td>${r.routeId}</td>
          <td>${r.collectorName}</td>
          <td>${r.collectionDate}</td>
          <td>${r.routeName}</td>
          <td>${r.materialType}</td>
          <td>${r.collectionPoints.length}</td>
          <td>${r.expectedTotalQuantity}</td>
          <td><span class="status-badge ${statusClass(r.status)}">${r.status}</span></td>
          <td class="inline-actions">
            <button class="btn btn-secondary small-btn" data-action="view" data-id="${r.routeId}">View</button>
            <button class="btn btn-primary small-btn" data-action="approve" data-id="${r.routeId}" ${r.status === 'Completed' ? 'disabled' : ''}>Approve</button>
            <button class="btn btn-danger small-btn" data-action="reject" data-id="${r.routeId}" ${r.status === 'Completed' ? 'disabled' : ''}>Reject</button>
          </td>
        </tr>
      `).join('');

      tableEmpty.classList.toggle('hidden', filtered.length > 0);

      tbody.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const route = getRoutes().find((x) => x.routeId === btn.dataset.id);
          if (!route) return;
          if (action === 'view') renderDetails(route);
          if (action === 'approve') setStatus(route.routeId, 'Approved');
          if (action === 'reject') setStatus(route.routeId, 'Rejected');
        });
      });
    };

    const render = () => {
      const routes = getRoutes();
      renderSummary(routes);
      renderTable(routes);
    };

    closeModal.addEventListener('click', () => modal.close());
    searchInput.addEventListener('input', render);
    statusFilter.addEventListener('change', render);
    render();
  }

  function initCompletion() {
    const routeSelect = document.getElementById('approvedRouteSelect');
    const empty = document.getElementById('approvedEmpty');
    const form = document.getElementById('completionForm');
    const summary = document.getElementById('selectedRouteSummary');
    const pointContainer = document.getElementById('pointCompletionContainer');
    const template = document.getElementById('pointCompletionTemplate');

    const approvedRoutes = () => getRoutes().filter((r) => r.status === 'Approved');
    let selectedRoute = null;

    const renderSelect = () => {
      const approved = approvedRoutes();
      routeSelect.innerHTML = '<option value="">Choose a route</option>' + approved.map((r) => `<option value="${r.routeId}">${r.routeId} • ${r.routeName} (${r.collectionDate})</option>`).join('');
      empty.classList.toggle('hidden', approved.length > 0);
    };

    const renderRoute = (route) => {
      summary.innerHTML = `
        <h3>${route.routeName}</h3>
        <p><strong>Route ID:</strong> ${route.routeId} | <strong>Collector:</strong> ${route.collectorName}</p>
        <p><strong>Date:</strong> ${route.collectionDate} | <strong>Material:</strong> ${route.materialType}</p>
        <p><strong>Planned points:</strong> ${route.collectionPoints.length}</p>
      `;

      pointContainer.innerHTML = '';
      route.collectionPoints.forEach((p, idx) => {
        const frag = template.content.cloneNode(true);
        frag.querySelector('.point-title').textContent = `#${idx + 1} ${p.spaceName} — ${p.address}`;
        pointContainer.appendChild(frag);
      });
      form.classList.remove('hidden');
    };

    routeSelect.addEventListener('change', () => {
      selectedRoute = approvedRoutes().find((r) => r.routeId === routeSelect.value) || null;
      if (!selectedRoute) {
        form.classList.add('hidden');
        return;
      }
      renderRoute(selectedRoute);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedRoute) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const pointRecords = [...pointContainer.querySelectorAll('.collection-point')].map((point, i) => ({
        plannedPoint: selectedRoute.collectionPoints[i].spaceName,
        visited: point.querySelector('[name="visited"]').value,
        actualBottles: Number(point.querySelector('[name="actualBottles"]').value || 0),
        actualCullet: Number(point.querySelector('[name="actualCullet"]').value || 0),
        issueComment: point.querySelector('[name="issueComment"]').value.trim()
      }));

      const completion = {
        routeId: selectedRoute.routeId,
        actualStartTime: fd.get('actualStartTime'),
        actualEndTime: fd.get('actualEndTime'),
        actualDistance: Number(fd.get('actualDistance')),
        fuelUsed: Number(fd.get('fuelUsed')),
        actualBottles: Number(fd.get('actualBottles') || 0),
        actualCullet: Number(fd.get('actualCullet') || 0),
        pointsVisited: Number(fd.get('pointsVisited')),
        missedPoints: Number(fd.get('missedPoints') || 0),
        missedReason: fd.get('missedReason').trim(),
        issuesEncountered: fd.get('issuesEncountered').trim(),
        finalRemarks: fd.get('finalRemarks').trim(),
        pointRecords,
        submittedAt: new Date().toISOString()
      };

      const completions = getCompletions().filter((c) => c.routeId !== selectedRoute.routeId);
      completions.unshift(completion);
      setCompletions(completions);

      const routes = getRoutes().map((r) => r.routeId === selectedRoute.routeId ? { ...r, status: 'Completed', completionSubmittedAt: completion.submittedAt } : r);
      setRoutes(routes);
      window.location.href = 'approval-dashboard.html';
    });

    renderSelect();
  }
})();
