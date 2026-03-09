#!/usr/bin/env bash

systemctl daemon-reload
systemctl enable ytl-tasks-maintenance.service
systemctl start ytl-tasks-maintenance.service
