#!/bin/sh

systemctl daemon-reload
systemctl enable ytl-linux-digabi2-ncsi
systemctl start ytl-linux-digabi2-ncsi
