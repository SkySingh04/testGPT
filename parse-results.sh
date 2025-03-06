#!/bin/bash

grep -oE "COMPLETE TESTRUN SUMMARY\.\s+Total tests: [0-9]+" ${GITHUB_WORKSPACE}/${WORKDIR}/report.txt | sed -r "s/\x1B\[[0-9;]*[mGK]//g" > ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_tests.out
grep -oE "COMPLETE TESTRUN SUMMARY\.\s+Total test passed: [0-9]+" ${GITHUB_WORKSPACE}/${WORKDIR}/report.txt | sed -r "s/\x1B\[[0-9;]*[mGK]//g" > ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_passed.out
grep -oE "COMPLETE TESTRUN SUMMARY\.\s+Total test failed: [0-9]+" ${GITHUB_WORKSPACE}/${WORKDIR}/report.txt | sed -r "s/\x1B\[[0-9;]*[mGK]//g" > ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_failed.out

cat ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_tests.out ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_passed.out ${GITHUB_WORKSPACE}/${WORKDIR}/final_total_failed.out > ${GITHUB_WORKSPACE}/${WORKDIR}/final.out

echo 'KEPLOY_REPORT<<EOF' >> $GITHUB_OUTPUT
cat ${GITHUB_WORKSPACE}/${WORKDIR}/final.out >> $GITHUB_OUTPUT
echo 'EOF' >> $GITHUB_OUTPUT