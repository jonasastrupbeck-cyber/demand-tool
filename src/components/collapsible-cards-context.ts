'use client';

// Flow dashboards render their chart cards collapsible (a chevron toggles each
// card's body). Rather than thread a `collapsible` prop through every ChartCard
// call site, the flow views wrap their content in this provider; ChartCard,
// CapabilityChart and TouchSeriesChart read it to decide whether to show the
// collapse control. Default false → transactional dashboards are unaffected.
import { createContext, useContext } from 'react';

export const CollapsibleCardsContext = createContext(false);
export const useCollapsibleCards = () => useContext(CollapsibleCardsContext);
