                              _   _    __    __                  _   _ 
  _ __     __ _            __| | (_)  / _|  / _|           ___  | | (_)
 | '_ \   / _` |  _____   / _` | | | | |_  | |_   _____   / __| | | | |
 | |_) | | (_| | |_____| | (_| | | | |  _| |  _| |_____| | (__  | | | |
 | .__/   \__, |          \__,_| |_| |_|   |_|            \___| |_| |_|
 |_|      |___/                                                        

     Author: Michael Sogos <michael.sogos@gurustudioweb.it> (https://github.com/michaelsogos)
    Version: 3.0.0
 PostgreSQL: 9.6+
    License: MIT
Description: PostgreSQL schema and data comparing tool


Missing execution options! Please specify one between -c, -ms, -mt, -s, -g execution option.


==============================
===   pg-diff-cli   HELP   ===
==============================

OPTION                      		DESCRIPTION
-h,  --help                		To show this help.
-c,  --compare             		To run compare and generate a patch file.
-ms, --migrate-to-source   		To run migration applying all missing patch files to SOURCE CLIENT.
-mt, --migrate-to-target   		To run migration applying all missing patch files to TARGET CLIENT.
-f,  --config-file         		To specify where to find config file, otherwise looks for 'pg-diff-config.json' on current working directory.
-p,  --patch-folder        		To set patch folder where save\retrieve patches (it will override configuration).
-s,  --save                		To save\register patch on migration history table without executing the script.
-g,  --generate-config     		To generate a new config file.


TO GENERATE CONFIG FILE: pg-diff -g [configuration-file-name]
                EXAMPLE: pg-diff -g 
                EXAMPLE: pg-diff -g my-config

             TO COMPARE: pg-diff -c configuration-name script-name
                EXAMPLE: pg-diff -c development my-script

             TO MIGRATE: pg-diff [-ms | -mt] configuration-name
                EXAMPLE: pg-diff -ms development
                EXAMPLE: pg-diff -mt development

            TO REGISTER: pg-diff -s configuration-name patch-file-name
                EXAMPLE: pg-diff -s development 20182808103040999_my-script.sql


