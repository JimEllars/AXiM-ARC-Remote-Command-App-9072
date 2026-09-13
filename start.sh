#!/bin/bash
npm run dev > vite.log 2>&1 &
echo $! > vite.pid
