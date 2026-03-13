#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './app.js';

const cli = meow(`
  Dream Catcher TUI - Intent-Based Network Slice Controller

  Usage
    $ dream-catcher-tui [options]

  Options
    --demo              Run in demo mode with simulated traffic
    --interface, -i     Network interface for live capture (default: ens19)
    --python            Path to Python 3 interpreter (default: python3)
    --speed             Demo playback speed multiplier (default: 1.0)
    --ingest            Backend ingest URL (POST /api/ingest/event)
    --throughput-mode   Throughput measurement mode: passive|active (default: passive)

  Examples
    $ dream-catcher-tui                     # Live mode on default interface
    $ dream-catcher-tui --demo              # Demo mode with simulated data
    $ dream-catcher-tui -i en0              # Live mode on en0
    $ dream-catcher-tui --demo --speed 2    # Fast demo
`, {
  importMeta: import.meta,
  flags: {
    demo: { type: 'boolean', default: false },
    interface: { type: 'string', shortFlag: 'i', default: 'ens19' },
    python: { type: 'string', default: 'python3' },
    speed: { type: 'number', default: 1.0 },
    ingest: { type: 'string' },
    throughputMode: { type: 'string', default: 'passive' },
  },
});

const mode = cli.flags.demo ? 'demo' : 'live';
const ingestUrl = cli.flags.ingest || process.env.BACKEND_INGEST_URL;

const throughputMode = cli.flags.throughputMode as 'passive' | 'active';

const { waitUntilExit } = render(
  <App
    mode={mode}
    interface={cli.flags.interface}
    pythonPath={cli.flags.python}
    demoSpeed={cli.flags.speed}
    ingestUrl={ingestUrl}
    throughputMode={throughputMode}
  />
);

waitUntilExit().then(() => {
  process.exit(0);
});
